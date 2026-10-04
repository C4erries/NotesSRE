package config_test

import (
	"os"
	"testing"
	"time"

	"note-service/internal/infrastructure/config"
)

func TestConfig_Defaults(t *testing.T) {
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error loading config: %v", err)
	}

	if cfg.HTTPPort != "8080" {
		t.Errorf("expected default HTTPPort 8080, got %s", cfg.HTTPPort)
	}
	if cfg.LogLevel != "info" {
		t.Errorf("expected default LogLevel info, got %s", cfg.LogLevel)
	}
	if cfg.ShutdownTimeout != 5*time.Second {
		t.Errorf("expected default ShutdownTimeout 5s, got %v", cfg.ShutdownTimeout)
	}
}

func TestConfig_EnvOverride(t *testing.T) {
	_ = os.Setenv("HTTP_PORT", "9090")
	_ = os.Setenv("LOG_LEVEL", "debug")
	defer func() {
		_ = os.Unsetenv("HTTP_PORT")
		_ = os.Unsetenv("LOG_LEVEL")
	}()

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("unexpected error loading config: %v", err)
	}

	if cfg.HTTPPort != "9090" {
		t.Errorf("expected HTTPPort 9090, got %s", cfg.HTTPPort)
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("expected LogLevel debug, got %s", cfg.LogLevel)
	}
}
