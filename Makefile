.PHONY: all proto gql generate build-backend build-frontend install-deps dev-backend dev-frontend test test-services test-coverage clean download-geoip infra stop-infra help

GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m

all: install-deps proto gql generate test build-backend build-frontend

help:
	@echo "$(YELLOW)Usage:$(RESET) make [target]"
	@echo ""
	@echo "$(YELLOW)Development:$(RESET)"
	@echo "  infra          - Start Postgres and Redis in Docker"
	@echo "  stop-infra     - Stop infrastructure containers"
	@echo "  dev-backend    - Run Go backend (connects to localhost DB)"
	@echo "  dev-frontend   - Run Vite frontend (connects to localhost API)"
	@echo ""
	@echo "$(YELLOW)Code Generation:$(RESET)"
	@echo "  proto          - Format, Lint and Generate gRPC code"
	@echo "  gql            - Generate GraphQL schemas"
	@echo "  generate       - Run go generate"

# --- Infrastructure ---

infra:
	@echo "$(GREEN)Starting DB and Redis...$(RESET)"
	@docker compose up -d postgres redis

stop-infra:
	@echo "$(GREEN)Stopping infrastructure...$(RESET)"
	@docker compose stop postgres redis

# --- Execution (Local DX) ---

dev-backend:
	@echo "$(GREEN)Starting Backend in Dev mode...$(RESET)"
	@cd backend && DB_HOST=localhost REDIS_HOST=localhost go run cmd/aerogram-api/main.go

dev-frontend:
	@echo "$(GREEN)Starting Frontend in Dev mode...$(RESET)"
	@cd frontend && VITE_API_URL=http://localhost:8080/query VITE_WS_URL=wss://localhost:8080/query npm run dev

# --- Code Generation ---

proto:
	@echo "$(GREEN)Running Buf...$(RESET)"
	@cd backend/internal/grpc/proto && buf format -w && buf lint && buf generate

gql:
	@echo "$(GREEN)Generating GraphQL...$(RESET)"
	@cd backend && go run github.com/99designs/gqlgen generate --config gqlgen.yml

generate:
	@echo "$(GREEN)Running go generate...$(RESET)"
	@cd backend && go generate ./...

# --- Testing ---

test:
	@cd backend && go test -p 1 -count=1 ./...

test-coverage:
	@cd backend && go test -coverprofile=coverage.out ./internal/services/... && go tool cover -func=coverage.out

# --- Build ---

build-backend:
	@cd backend && go build -ldflags="-s -w" -o ../bin/server ./cmd/aerogram-api/main.go

build-frontend:
	@cd frontend && npm run build

# --- Deps ---

install-deps:
	@cd backend && go mod tidy
	@cd frontend && npm install
	@$(MAKE) download-geoip

download-geoip:
	@mkdir -p backend/assets
	@if [ ! -f backend/assets/GeoLite2-City.mmdb ]; then \
		curl -L https://raw.githubusercontent.com/P3TERX/GeoLite.mmdb/download/GeoLite2-City.mmdb -o backend/assets/GeoLite2-City.mmdb; \
	fi

clean:
	@rm -rf backend/internal/grpc/gen/* bin/ frontend/dist/ backend/coverage.out
