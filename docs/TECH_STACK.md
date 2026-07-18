# Tech Stack

## Backend

| Technology | Purpose |
|---|---|
| [Go](https://go.dev/) | Core backend language |
| [gRPC](https://grpc.io/) | Internal service-to-service communication |
| [Protocol Buffers](https://protobuf.dev/) | Message/schema definitions for gRPC |
| [GraphQL (99designs/gqlgen)](https://github.com/99designs/gqlgen) | Public-facing API layer |
| [spf13/viper](https://github.com/spf13/viper) | Configuration management |
| [godotenv](https://github.com/joho/godotenv) | Loading `.env` files in local development |

## Data Layer

| Technology | Purpose |
|---|---|
| [PostgreSQL](https://www.postgresql.org/) | Primary relational database |
| [Redis (go-redis v9)](https://github.com/redis/go-redis) | Caching, rate limiting, verification codes/session data |
| [MinIO / AWS S3 (aws-sdk-go-v2)](https://github.com/aws/aws-sdk-go-v2) | Object storage (S3-compatible) |

## Frontend

| Technology | Purpose |
|---|---|
| [React](https://react.dev/) | UI library |
| [Relay](https://relay.dev/) | GraphQL client and data fetching |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |

## Infrastructure

| Technology | Purpose |
|---|---|
| [Docker](https://www.docker.com/) | Containerization |
| [Caddy](https://caddyserver.com/) | Reverse proxy / web server with automatic HTTPS |

---

## Architecture Notes

- The backend exposes both **gRPC** (internal/service communication) and **GraphQL** (client-facing API) endpoints.
- **Redis** is used beyond caching — it backs rate limiting and short-lived verification code storage (e.g. 2FA/email verification flows).
- **Relay** on the frontend consumes the GraphQL API and manages normalized client-side caching.
- **Caddy** sits in front of the services, handling TLS termination and routing in production.
