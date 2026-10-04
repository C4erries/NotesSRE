package main

import (
	"context"
	"flag"
	"fmt"
	"io/fs"
	"log/slog"
	"os"
	"path"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"note-service/migrations"
)

func main() {
	var (
		dbURL     string
		direction string
		timeout   time.Duration
	)

	flag.StringVar(&dbURL, "database-url", "", "PostgreSQL connection string (or DATABASE_URL env)")
	flag.StringVar(&direction, "direction", "up", "Migration direction: up or down")
	flag.DurationVar(&timeout, "timeout", 60*time.Second, "Timeout waiting for database readiness")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		logger.Error("DATABASE_URL is not set")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	conn, err := connectWithRetry(ctx, dbURL, logger)
	if err != nil {
		logger.Error("failed to connect to database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	if err := initMigrationTable(ctx, conn); err != nil {
		logger.Error("failed to initialize schema_migrations table", slog.String("error", err.Error()))
		os.Exit(1)
	}

	switch direction {
	case "up":
		if err := runUp(ctx, conn, logger); err != nil {
			logger.Error("migration up failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	case "down":
		if err := runDown(ctx, conn, logger); err != nil {
			logger.Error("migration down failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	default:
		logger.Error("unknown migration direction", slog.String("direction", direction))
		os.Exit(1)
	}

	logger.Info("migrations completed successfully")
}

func connectWithRetry(ctx context.Context, dbURL string, logger *slog.Logger) (*pgx.Conn, error) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	var lastErr error
	for {
		conn, err := pgx.Connect(ctx, dbURL)
		if err == nil {
			if pingErr := conn.Ping(ctx); pingErr == nil {
				logger.Info("connected to database successfully")
				return conn, nil
			} else {
				_ = conn.Close(ctx)
				lastErr = pingErr
			}
		} else {
			lastErr = err
		}

		logger.Warn("waiting for database connection...", slog.String("error", lastErr.Error()))

		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("timeout waiting for database: %w (last error: %v)", ctx.Err(), lastErr)
		case <-ticker.C:
		}
	}
}

func initMigrationTable(ctx context.Context, conn *pgx.Conn) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`
	_, err := conn.Exec(ctx, query)
	return err
}

func runUp(ctx context.Context, conn *pgx.Conn, logger *slog.Logger) error {
	entries, err := fs.ReadDir(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("reading embedded migrations: %w", err)
	}

	var upFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			upFiles = append(upFiles, entry.Name())
		}
	}
	sort.Strings(upFiles)

	rows, err := conn.Query(ctx, "SELECT version FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("querying applied migrations: %w", err)
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return fmt.Errorf("scanning migration version: %w", err)
		}
		applied[v] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterating applied migrations: %w", err)
	}

	for _, file := range upFiles {
		version := strings.TrimSuffix(file, ".up.sql")
		if applied[version] {
			logger.Info("migration already applied", slog.String("version", version))
			continue
		}

		logger.Info("applying migration", slog.String("file", file), slog.String("version", version))

		content, err := migrations.FS.ReadFile(file)
		if err != nil {
			return fmt.Errorf("reading migration file %s: %w", file, err)
		}

		tx, err := conn.Begin(ctx)
		if err != nil {
			return fmt.Errorf("starting transaction for %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, string(content)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("executing migration %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", version); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("recording migration %s: %w", file, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("committing migration %s: %w", file, err)
		}

		logger.Info("migration applied successfully", slog.String("version", version))
	}

	return nil
}

func runDown(ctx context.Context, conn *pgx.Conn, logger *slog.Logger) error {
	var latestVersion string
	err := conn.QueryRow(ctx, "SELECT version FROM schema_migrations ORDER BY applied_at DESC, version DESC LIMIT 1").Scan(&latestVersion)
	if err != nil {
		if err == pgx.ErrNoRows {
			logger.Info("no applied migrations to roll back")
			return nil
		}
		return fmt.Errorf("querying latest migration: %w", err)
	}

	downFile := latestVersion + ".down.sql"
	logger.Info("rolling back migration", slog.String("version", latestVersion), slog.String("file", downFile))

	content, err := migrations.FS.ReadFile(path.Clean(downFile))
	if err != nil {
		return fmt.Errorf("reading down migration file %s: %w", downFile, err)
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("starting transaction: %w", err)
	}

	if _, err := tx.Exec(ctx, string(content)); err != nil {
		_ = tx.Rollback(ctx)
		return fmt.Errorf("executing rollback %s: %w", downFile, err)
	}

	if _, err := tx.Exec(ctx, "DELETE FROM schema_migrations WHERE version = $1", latestVersion); err != nil {
		_ = tx.Rollback(ctx)
		return fmt.Errorf("deleting migration record %s: %w", latestVersion, err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("committing rollback: %w", err)
	}

	logger.Info("migration rolled back successfully", slog.String("version", latestVersion))
	return nil
}
