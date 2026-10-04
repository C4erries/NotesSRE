package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"note-service/internal/application/category"
	"note-service/internal/application/note"
	"note-service/internal/infrastructure/config"
	"note-service/internal/infrastructure/db"
	httpPkg "note-service/internal/infrastructure/http"
	"note-service/internal/infrastructure/http/generated"
	"note-service/internal/infrastructure/repository"
)

type App struct {
	cfg        *config.Config
	logger     *slog.Logger
	httpServer *http.Server
	pool       *pgxpool.Pool
}

// New builds and wires the entire application dependency graph.
func New(ctx context.Context, cfg *config.Config, logger *slog.Logger) (*App, error) {
	initCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	pool, err := db.NewPool(initCtx, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("init db pool: %w", err)
	}

	transactor := db.NewTransactor(pool)
	categoryRepo := repository.NewCategoryPostgres(transactor)
	noteRepo := repository.NewNotePostgres(transactor)

	categoryService := category.NewService(categoryRepo, transactor)
	noteService := note.NewService(noteRepo, categoryRepo, transactor)

	server := httpPkg.NewServer(categoryService, noteService, transactor, logger)
	strictHandler := generated.NewStrictHandler(server, nil)

	mux := http.NewServeMux()
	generated.HandlerWithOptions(strictHandler, generated.StdHTTPServerOptions{
		BaseRouter: mux,
	})

	var handler http.Handler = mux
	handler = httpPkg.LoggingMiddleware(logger)(handler)
	handler = httpPkg.CORSMiddleware(handler)
	handler = httpPkg.RecovererMiddleware(logger)(handler)

	httpServer := &http.Server{
		Addr:         ":" + cfg.HTTPPort,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	return &App{
		cfg:        cfg,
		logger:     logger,
		httpServer: httpServer,
		pool:       pool,
	}, nil
}

// Run starts the HTTP server and blocks until the context is canceled (signal received).
// Then it gracefully shuts down the server and closes database connections.
func (a *App) Run(ctx context.Context) error {
	serverErr := make(chan error, 1)

	go func() {
		a.logger.Info("http server listening", slog.String("addr", a.httpServer.Addr))
		if err := a.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	select {
	case err := <-serverErr:
		return fmt.Errorf("http server failed: %w", err)
	case <-ctx.Done():
		a.logger.Info("shutting down application gracefully...")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), a.cfg.ShutdownTimeout)
	defer cancel()

	if err := a.httpServer.Shutdown(shutdownCtx); err != nil {
		a.logger.Error("forced http server shutdown", slog.String("error", err.Error()))
		_ = a.httpServer.Close()
	}

	a.pool.Close()
	a.logger.Info("application stopped gracefully")
	return nil
}
