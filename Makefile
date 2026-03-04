.PHONY: all proto gql generate build-backend build-frontend install-deps dev-backend dev-frontend test test-services test-coverage clean

GREEN := \033[0;32m
RESET := \033[0m

all: install-deps proto gql generate build-backend build-frontend

# --- Development ---

proto:
	@echo "$(GREEN)Running Buf (Lint, Format, Generate)...$(RESET)"
	@cd backend/internal/grpc/proto && buf format -w
	@cd backend/internal/grpc/proto && buf lint
	@cd backend/internal/grpc/proto && buf generate

gql:
	@echo "$(GREEN)Generating GraphQL...$(RESET)"
	@cd backend && go run github.com/99designs/gqlgen generate --config gqlgen.yml

generate:
	@echo "$(GREEN)Running Go Generate...$(RESET)"
	@cd backend && go generate ./...

dev-backend:
	@cd backend && go run cmd/aerogram-api/main.go

dev-frontend:
	@cd frontend && npm run dev

# --- Testing ---

test:
	@echo "$(GREEN)Running all backend tests...$(RESET)"
	@cd backend && go test ./...

test-services:
	@echo "$(GREEN)Running service layer tests...$(RESET)"
	@cd backend && go test -v ./internal/services/...

test-coverage:
	@echo "$(GREEN)Generating test coverage report...$(RESET)"
	@cd backend && go test -coverprofile=coverage.out ./internal/services/...
	@cd backend && go tool cover -func=coverage.out

# --- Build ---

build-backend:
	@echo "$(GREEN)Building Backend Binary...$(RESET)"
	@cd backend && go build -o ../bin/server ./cmd/aerogram-api/main.go

build-frontend:
	@echo "$(GREEN)Building Frontend...$(RESET)"
	@cd frontend && npm run build

# --- Helpers ---

install-deps:
	@echo "$(GREEN)Installing Dependencies...$(RESET)"
	@cd backend && go mod tidy
	@cd frontend && npm install

clean:
	@echo "$(GREEN)Cleaning up generated files and binaries...$(RESET)"
	@rm -rf backend/internal/grpc/gen/*
	@rm -rf backend/internal/graph/generated.go
	@rm -rf bin/
	@rm -rf frontend/dist/
	@rm -f backend/coverage.out

download-geoip:
	@echo "$(GREEN)Downloading GeoIP database...$(RESET)"
	@mkdir -p backend/assets
	@curl -L https://raw.githubusercontent.com/P3TERX/GeoLite.mmdb/download/GeoLite2-City.mmdb -o backend/assets/GeoLite2-City.mmdb
