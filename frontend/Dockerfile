FROM node:22-alpine AS builder
ARG VITE_API_URL
ARG VITE_WS_URL
WORKDIR /app
COPY frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY frontend/ .
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM caddy:2-alpine
WORKDIR /usr/share/caddy
COPY --from=builder /app/dist .
EXPOSE 80 3443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
