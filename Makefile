export PATH := $(shell go env GOPATH)/bin:$(PATH)

.PHONY: help all build generate run run-migrator test clean \
        up down restart logs ps stats health dev-frontend docker-up docker-down

# Default target
help:
	@echo "Available commands in Note Service Makefile:"
	@echo "  make up           - Start all services (db, migrator, backend, frontend) via Docker Compose in background"
	@echo "  make down         - Stop all Docker Compose services and remove volumes"
	@echo "  make restart      - Restart the entire stack"
	@echo "  make logs         - Stream logs from all running containers"
	@echo "  make ps           - View status and ports of running containers"
	@echo "  make stats        - View memory and CPU utilization of containers (NFT-2.1 check)"
	@echo "  make health       - Check SRE health probe (/healthz)"
	@echo ""
	@echo "Local development commands:"
	@echo "  make generate     - Re-generate Go API types and StrictServerInterface from OpenAPI spec"
	@echo "  make build        - Compile bin/api and bin/migrator locally"
	@echo "  make test         - Run all Go unit and integration tests"
	@echo "  make run          - Run backend locally (requires running PostgreSQL)"
	@echo "  make dev-frontend - Run React frontend dev server with HMR on port 3000"
	@echo "  make migrate-up   - Run DB migrations up locally"
	@echo "  make migrate-down - Roll back latest DB migration locally"
	@echo "  make clean        - Remove compiled binaries and build artifacts"

all: generate build

# --- Docker & Compose Commands ---

up:
	docker compose up -d --build

down:
	docker compose down -v

restart: down up

logs:
	docker compose logs -f

ps:
	docker compose ps

stats:
	docker stats --no-stream

health:
	@echo "Checking SRE healthz probe on port 80 (Frontend reverse proxy)..."
	@curl -s -i http://localhost:80/healthz || curl -s -i http://localhost:8080/healthz

# Aliases
docker-up: up
docker-down: down

# --- Local Go Commands ---

generate:
	@which oapi-codegen > /dev/null || (echo "Installing oapi-codegen..." && go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest)
	mkdir -p internal/infrastructure/http/generated
	oapi-codegen -config oapi-codegen.yaml api/openapi.yaml

build:
	mkdir -p bin
	go build -ldflags="-s -w" -o bin/api ./cmd/api
	go build -ldflags="-s -w" -o bin/migrator ./cmd/migrator

test:
	go test -v ./...

run:
	go run ./cmd/api

run-migrator:
	go run ./cmd/migrator -direction up

migrate-up:
	go run ./cmd/migrator -direction up

migrate-down:
	go run ./cmd/migrator -direction down

dev-frontend:
	cd web && npm run dev

clean:
	rm -rf bin/ web/dist/
