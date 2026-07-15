# Tech Stack

This project is built as a modular monolith designed for real-time communication, performance, and type-safe integration between the backend and frontend.

## Backend

* **Language:** [Go 1.24+](https://go.dev/)
* **API Layer:** [GraphQL](https://graphql.org/) via [gqlgen](https://gqlgen.com/)
* **Internal Communication:** [gRPC](https://grpc.io/)
* **Database:** [PostgreSQL 16+](https://www.postgresql.org/)
* **Data Access:** [sqlc](https://sqlc.dev/)
* **Cache & Pub/Sub:** [Redis 7+](https://redis.io/)
* **Storage:** [MinIO](https://min.io/) (S3-compatible)
* **Infrastructure:** Docker, Caddy (Reverse Proxy)

## Frontend

* **Framework:** [React 18+](https://react.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Data Fetching:** [Relay](https://relay.dev/) (GraphQL client)
* **Routing:** [TanStack Router](https://tanstack.com/router)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Build Tool:** [Vite](https://vitejs.dev/)

## Tooling & Utilities

* **Database Migrations:** [golang-migrate](https://github.com/golang-migrate/migrate)
* **Validation:** [Zod](https://zod.dev/)
* **Forms:** [React Hook Form](https://react-hook-form.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Formatting/Linting:** Standard Go/TS tooling (configured via `Makefile`)

---

*For local development, the stack is orchestrated via `docker-compose`, exposing all services through a single Caddy entry point on port `8080`.*
