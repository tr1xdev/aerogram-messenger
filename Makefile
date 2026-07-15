.PHONY: all proto gql generate sqlc build-backend build-frontend install-deps \
        dev-backend dev-frontend test test-coverage clean download-geoip \
        infra stop-infra help setup-certs

GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RESET  := \033[0m

PWD := $(shell pwd)
BACKEND_DIR := backend
FRONTEND_DIR := frontend
ASSETS_DIR := $(BACKEND_DIR)/assets
CERTS_DIR := certs

all: install-deps proto sqlc gql generate test build-backend build-frontend

help:
	@echo "$(YELLOW)Aerogram Messenger - Development Toolkit$(RESET)"
	@echo ""
	@echo "$(CYAN)Infrastructure:$(RESET)"
	@echo "  make infra            - Start Postgres and Redis (Docker)"
	@echo "  make stop-infra       - Stop infrastructure containers"
	@echo "  make setup-certs      - Install Caddy CA to Windows & WSL2"
	@echo ""
	@echo "$(CYAN)Development:$(RESET)"
	@echo "  make dev-backend      - Run Go API with local env and TLS"
	@echo "  make dev-frontend     - Run Vite frontend (Hot Reload)"
	@echo ""
	@echo "$(CYAN)Code Generation:$(RESET)"
	@echo "  make proto            - Generate gRPC code using Buf"
	@echo "  make sqlc             - Generate type-safe Go from SQL"
	@echo "  make gql              - Generate GraphQL resolvers & models"
	@echo "  make generate         - Run standard go generate"
	@echo ""
	@echo "$(CYAN)Testing & Quality:$(RESET)"
	@echo "  make test             - Run all backend tests"
	@echo "  make test-coverage    - Generate and view test coverage"
	@echo "  make lint             - Run golangci-lint (if installed)"
	@echo ""
	@echo "$(CYAN)Build & Cleanup:$(RESET)"
	@echo "  make install-deps     - Install Go & NPM dependencies + GeoIP"
	@echo "  make build-backend    - Compile optimized Go binary"
	@echo "  make build-frontend   - Build production-ready frontend"
	@echo "  make clean            - Remove binaries, gen-code and coverage"

# --- Infrastructure ---

infra:
	@echo "$(GREEN)▶ Starting infrastructure...$(RESET)"
	docker compose up -d postgres redis

stop-infra:
	@echo "$(YELLOW)▶ Stopping infrastructure...$(RESET)"
	docker compose stop postgres redis

# --- Development ---

dev-backend:
	@echo "$(GREEN)▶ Starting Backend Server...$(RESET)"
	@cd $(BACKEND_DIR) && \
	DB_HOST=localhost \
	REDIS_HOST=localhost \
	CONFIG_PATH=$(PWD)/config.yaml \
	CERT_PATH=$(PWD)/$(CERTS_DIR)/localhost+2.pem \
	KEY_PATH=$(PWD)/$(CERTS_DIR)/localhost+2-key.pem \
	GEOIP_PATH=$(PWD)/$(ASSETS_DIR)/GeoLite2-City.mmdb \
	VERIFICATION_TEMPLATE_PATH=$(PWD)/$(BACKEND_DIR)/internal/templates/verification.html \
	go run cmd/aerogram-api/main.go

dev-frontend:
	@echo "$(GREEN)▶ Starting Frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && \
	VITE_API_URL=https://localhost:8080/query \
	VITE_WS_URL=wss://localhost:8080/query \
	npm run dev

# --- Code Generation ---

proto:
	@echo "$(GREEN)▶ Generating gRPC code...$(RESET)"
	@cd $(BACKEND_DIR)/internal/grpc/proto && buf format -w && buf lint && buf generate

sqlc:
	@echo "$(GREEN)▶ Generating SQLC code...$(RESET)"
	@cd $(BACKEND_DIR) && sqlc generate

gql:
	@echo "$(GREEN)▶ Generating GraphQL code...$(RESET)"
	@cd $(BACKEND_DIR) && go run -mod=mod github.com/99designs/gqlgen generate --config gqlgen.yml

generate:
	@echo "$(GREEN)▶ Running go generate...$(RESET)"
	@cd $(BACKEND_DIR) && go generate ./...

# --- Quality & Tests ---

test:
	@echo "$(GREEN)▶ Running tests...$(RESET)"
	@cd $(BACKEND_DIR) && go test -v -p 1 -count=1 ./...

test-coverage:
	@echo "$(GREEN)▶ Calculating coverage...$(RESET)"
	@cd $(BACKEND_DIR) && go test -coverprofile=coverage.out ./internal/services/...
	@cd $(BACKEND_DIR) && go tool cover -func=coverage.out

lint:
	@echo "$(GREEN)▶ Linting code...$(RESET)"
	@cd $(BACKEND_DIR) && golangci-lint run

# --- Build & Dependencies ---

install-deps:
	@echo "$(GREEN)▶ Installing dependencies...$(RESET)"
	@cd $(BACKEND_DIR) && go mod tidy
	@cd $(FRONTEND_DIR) && npm install
	@$(MAKE) download-geoip

download-geoip:
	@echo "$(GREEN)▶ Checking GeoIP database...$(RESET)"
	@mkdir -p $(ASSETS_DIR)
	@if [ ! -f $(ASSETS_DIR)/GeoLite2-City.mmdb ]; then \
		curl -L https://raw.githubusercontent.com/P3TERX/GeoLite.mmdb/download/GeoLite2-City.mmdb -o $(ASSETS_DIR)/GeoLite2-City.mmdb; \
	else \
		echo "GeoIP already exists."; \
	fi

build-backend:
	@echo "$(GREEN)▶ Building backend binary...$(RESET)"
	@cd $(BACKEND_DIR) && go build -ldflags="-s -w" -o ../bin/server ./cmd/aerogram-api/main.go

build-frontend:
	@echo "$(GREEN)▶ Building frontend bundle...$(RESET)"
	@cd $(FRONTEND_DIR) && npm run build

clean:
	@echo "$(YELLOW)▶ Cleaning up...$(RESET)"
	rm -rf $(BACKEND_DIR)/internal/grpc/gen/* bin/ $(FRONTEND_DIR)/dist/ $(BACKEND_DIR)/coverage.out
