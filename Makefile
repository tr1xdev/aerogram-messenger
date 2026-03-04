.PHONY: all proto gql generate build-backend build-frontend install-deps dev-backend dev-frontend clean

GREEN := \033[0;32m
RESET := \033[0m

all: install-deps proto gql generate build-backend build-frontend

# --- Backend Tasks ---

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

build-backend:
	@echo "$(GREEN)Building Backend Binary...$(RESET)"
	@cd backend && go build -o ../bin/server ./cmd/aerogram-api/main.go

# --- Frontend Tasks ---

dev-frontend:
	@cd frontend && npm run dev

build-frontend:
	@echo "$(GREEN)Building Frontend...$(RESET)"
	@cd frontend && npm run build

# --- Helpers ---

install-deps:
	@echo "$(GREEN)Installing Dependencies...$(RESET)"
	@cd backend && go mod tidy
	@cd frontend && npm install

clean:
	@rm -rf backend/internal/grpc/gen/*
	@rm -rf backend/internal/graph/generated.go
	@rm -rf bin/
	@rm -rf frontend/dist/
