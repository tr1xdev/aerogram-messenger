.PHONY: generate server all proto clean proto-lint proto-breaking proto-format gql-generate

GREEN := \033[0;32m
RESET := \033[0m

all: proto generate server

proto-format:
	@cd internal/grpc/proto && buf format -w

proto-lint:
	@cd internal/grpc/proto && buf lint

proto-breaking:
	@cd internal/grpc/proto && buf breaking --against '.git#branch=main'

proto-generate:
	@cd internal/grpc/proto && buf generate

proto: proto-format proto-lint proto-generate

proto-ci: proto-lint proto-breaking proto-generate

gql-generate:
	@go run github.com/99designs/gqlgen generate --config gqlgen.yml

generate: gql-generate
	@go generate ./...

server:
	@go run cmd/aerogram-api/main.go

clean:
	@rm -rf internal/grpc/gen/*
	@rm -rf internal/graph/generated.go
