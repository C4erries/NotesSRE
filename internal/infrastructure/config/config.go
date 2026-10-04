package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	HTTPPort        string        `mapstructure:"HTTP_PORT"`
	DatabaseURL     string        `mapstructure:"DATABASE_URL"`
	LogLevel        string        `mapstructure:"LOG_LEVEL"`
	LogFormat       string        `mapstructure:"LOG_FORMAT"`
	ShutdownTimeout time.Duration `mapstructure:"SHUTDOWN_TIMEOUT"`
}

func Load() (*Config, error) {
	v := viper.New()

	v.SetDefault("HTTP_PORT", "8080")
	v.SetDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/notes?sslmode=disable")
	v.SetDefault("LOG_LEVEL", "info")
	v.SetDefault("LOG_FORMAT", "json")
	v.SetDefault("SHUTDOWN_TIMEOUT", 5*time.Second)

	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	return &cfg, nil
}
