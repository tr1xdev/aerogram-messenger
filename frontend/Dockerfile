FROM node:24-alpine AS builder

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

FROM nginx:1.25-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /etc/nginx/certs && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /etc/nginx/certs

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R appuser:appgroup /usr/share/nginx/html

USER appuser

EXPOSE 8080 8443

CMD ["nginx", "-g", "daemon off;"]
