FROM golang:1.24-alpine AS builder
RUN apk add --no-cache make git gcc musl-dev
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY backend/ .
COPY config.yaml .
RUN mkdir -p assets
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/server ./cmd/aerogram-api/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/bin/server .
COPY --from=builder /app/config.yaml .
COPY --from=builder /app/internal/templates ./internal/templates
COPY --from=builder /app/assets ./assets
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080 50051
ENTRYPOINT ["./server"]
