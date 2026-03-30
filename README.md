[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![Status](https://img.shields.io/badge/status-wip-orange)

# Aerogram

Aerogram is a high-performance, open-source real-time messaging platform built with [Go](https://go.dev/) and [React](https://reactjs.org/). It operates as a modular monolith utilizing a [GraphQL](https://graphql.org/) API for the frontend and [gRPC](https://grpc.io/) with [Protocol Buffers](https://protobuf.dev/) for internal service communication, backed by [PostgreSQL](https://www.postgresql.org/) (via [sqlc](https://sqlc.dev/)) and [Redis](https://redis.io/) for Pub/Sub. The networking stack is designed for modern requirements, serving traffic over [HTTP/2](https://httpwg.org/specs/rfc7540.html) (TLS) with experimental [HTTP/3](https://quicwg.org/) (QUIC) support.

---

## Prerequisites

The following environments are required for local development and have been tested for compatibility:

* **Go:** `v1.25.5` or higher (**Required**)
* **Docker:** `v29.3.1`+ with Compose
* **Node.js & npm:** `v24.14.0`+ / `v11.12.0`+
* **PostgreSQL:** `v16.13`+ (psql client)
* **Redis:** `v7.0.15`+ (redis-cli)
* **Tools:** `golang-migrate`, `mkcert`, `sqlc`, and `gqlgen` (optional/development)

---

## Configuration

Before running the application, you must set up your environment variables:

1. Copy the example configuration file:
```bash
cp .env.example .env
````

2.  Open `.env` and update the values (API keys, database credentials, etc.) to match your local environment.

-----

## Quick Start

### Docker (Recommended)

The fastest way to launch the entire stack with local certificates:

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/tr1xdev/aerogram-messenger.git && cd aerogram-messenger
    ```
2.  **Build and start services:**
    ```bash
    docker compose up --build -d
    ```
3.  **Access the application:**
      * **Frontend:** [https://localhost:3443](https://www.google.com/search?q=https://localhost:3443)
      * **Backend API:** [https://localhost:8080/query](https://www.google.com/search?q=https://localhost:8080/query)

### Local Development

1.  **Setup Infrastructure & Deps:**
    ```bash
    make infra          # Starts Postgres & Redis containers
    make install-deps   # Installs Go/NPM modules & GeoIP data
    ```
2.  **Code Generation:**
    ```bash
    make proto gql      # Generates gRPC and GraphQL code
    ```
3.  **Run Services (in separate terminals):**
    ```bash
    make dev-backend    # Starts Go server at https://localhost:8080
    make dev-frontend   # Starts Vite at http://localhost:5173
    ```

> [\!IMPORTANT]
> **Note on TLS:** The application requires SSL certificates in `certs/` (`localhost+2.pem` and `localhost+2-key.pem`). You can generate them using [mkcert](https://github.com/FiloSottile/mkcert) via `mkcert localhost`.
