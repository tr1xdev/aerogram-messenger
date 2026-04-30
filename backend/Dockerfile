FROM golang:1.24-alpine AS builder

RUN sed -i 's/https/http/g' /etc/apk/repositories && \
    apk add --no-cache make git gcc musl-dev

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

RUN sed -i 's/https/http/g' /etc/apk/repositories && \
    apk --no-cache add ca-certificates tzdata openssl && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/bin/server .
COPY --from=builder /app/config.yaml .
COPY --from=builder /app/internal/templates ./internal/templates
COPY --from=builder /app/assets ./assets

RUN mkdir -p /app/certs && chown -R appuser:appgroup /app

RUN echo '#!/bin/sh\n\
if [ ! -f "$TLS_CERT_PATH" ]; then\n\
  openssl req -x509 -newkey rsa:4096 -keyout "$TLS_KEY_PATH" -out "$TLS_CERT_PATH" -sha256 -days 365 -nodes -subj "/CN=localhost"\n\
fi\n\
exec ./server' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER appuser

ENV TLS_CERT_PATH=/app/certs/localhost+2.pem
ENV TLS_KEY_PATH=/app/certs/localhost+2-key.pem

EXPOSE 8080 50051

ENTRYPOINT ["/app/entrypoint.sh"]
