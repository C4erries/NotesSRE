export PATH := $(shell go env GOPATH)/bin:$(PATH)

.PHONY: all build generate migrate-up migrate-down docker-up docker-down test clean

all: generate build

generate:
	@which oapi-codegen > /dev/null || (echo "Installing oapi-codegen..." && go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest)
	mkdir -p internal/infrastructure/http/generated
	oapi-codegen -config oapi-codegen.yaml api/openapi.yaml

build:
	mkdir -p bin
	go build -o bin/api ./cmd/api
	go build -o bin/migrator ./cmd/migrator

migrate-up:
	go run ./cmd/migrator -direction up

migrate-down:
	go run ./cmd/migrator -direction down

docker-up:
	docker compose up --build

docker-down:
	docker compose down -v

test:
	go test -v ./...

clean:
	rm -rf bin/
