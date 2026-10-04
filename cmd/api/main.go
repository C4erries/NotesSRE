package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"note-service/internal/app"
	"note-service/internal/infrastructure/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	logger := setupLogger(cfg.LogLevel, cfg.LogFormat)
	slog.SetDefault(logger)

	logger.Info("starting note service",
		slog.String("port", cfg.HTTPPort),
		slog.String("log_level", cfg.LogLevel),
		slog.String("log_format", cfg.LogFormat),
	)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	application, err := app.New(ctx, cfg, logger)
	if err != nil {
		logger.Error("failed to initialize application", slog.String("error", err.Error()))
		os.Exit(1)
	}

	if err := application.Run(ctx); err != nil {
		logger.Error("application exited with error", slog.String("error", err.Error()))
		os.Exit(1)
	}
}

func setupLogger(levelStr, formatStr string) *slog.Logger {
	var level slog.Level
	switch strings.ToLower(levelStr) {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{Level: level}

	var handler slog.Handler
	if strings.ToLower(formatStr) == "text" {
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}
