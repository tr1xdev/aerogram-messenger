[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![Status](https://img.shields.io/badge/status-wip-orange)

# Aerogram


## About

Aerogram is a high-performance, open-source real-time messaging platform built with Go and React. Designed as a modular monolith, it emphasizes end-to-end type safety and system integrity using a gRPC-backed architecture and GraphQL. The project focuses on a modern, low-latency networking stack and architectural scalability, providing a robust foundation for real-time communication.

---

## Prerequisites

The following environments are required for local development and have been tested for compatibility:

* **Go:** `v1.24` or higher (**Required**)
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

The fastest way to launch the entire stack with automatic TLS:

1. **Clone this repository:**
    ```bash
    git clone [https://github.com/tr1xdev/aerogram-messenger.git](https://github.com/tr1xdev/aerogram-messenger.git) && cd aerogram-messenger
    ```
2. **Build and start services:**
    ```bash
    docker compose up --build -d
    ```
3. **Install SSL Trust:**
    To trust Caddy's local certificates in your browser and system:
    
    ```bash
    make setup-certs
    ```
4. **Access the application:**
    * **Frontend:** [https://localhost:3443](https://localhost:3443)
    * **Backend API:** [https://localhost:3443/query](https://localhost:3443/query)

### Local Development

1. **Setup Infrastructure & Deps:**
    ```bash
    make infra          # Starts Postgres & Redis containers
    make install-deps   # Installs Go/NPM modules & GeoIP data
    ```
2. **Generate TLS Certificates:**
    Required for secure communication outside Docker:
    ```bash
    mkdir -p certs && mkcert -install && mkcert -destdir certs localhost
    ```
3. **Code Generation:**
    ```bash
    make proto gql      # Generates gRPC and GraphQL code
    ```
4. **Run Services (in separate terminals):**
    ```bash
    make dev-backend    # Starts Go server at https://localhost:8080
    make dev-frontend   # Starts Vite at http://localhost:5173
    ```
