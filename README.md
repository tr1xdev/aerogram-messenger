[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![Status](https://img.shields.io/badge/status-wip-orange)

# Aerogram

## About

Aerogram is a real-time messaging platform built with **Go** and **React**. It is designed as a modular monolith focused on low-latency communication, type safety, and scalable architecture. The backend uses a **gRPC-based** internal system with a **GraphQL API** layer. The frontend is built with **React**, **Relay**, and **shadcn/ui**, using **Tailwind CSS** for styling and UI composition. The project provides a solid foundation for building modern real-time chat applications.

---

## Prerequisites

The following environments are required for local development and have been tested for compatibility:

* **Go:** `v1.24` or higher (**Required**)
* **Docker:** `v29.3.1`+ with Compose
* **Node.js & npm:** `v24.14.0`+ / `v11.12.0`+
* **PostgreSQL:** `v16.13`+ (psql client)
* **Redis:** `v7.0.15`+ (redis-cli)
* **Tools:** `golang-migrate`, `sqlc`, and `gqlgen` (optional/development)

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

1. **Clone this repository:**

```bash
git clone https://github.com/tr1xdev/aerogram-messenger.git && cd aerogram-messenger
```

2. **Build and start services:**

```bash
docker compose up --build -d
```

3. **Access the application:**
    * Open **[https://localhost:8080](https://localhost:8080)** (backend API available at `/query`)

### Local Development

1. **Setup infrastructure & dependencies:**

```bash
make infra install-deps   # Postgres & Redis + Go/NPM module + GeoIP data
```

2. **Generate code:**

```bash
make proto gql            # gRPC and GraphQL codegen
```
  
3. **Run services** (in separate terminals):

```bash
make dev-backend    # https://localhost:8080
make dev-frontend   # http://localhost:5173
```

## Features

Aerogram supports private chats, groups, channels, media attachments, OTP auth, bot integrations and more.  
👉 See [docs/FEATURES.md](docs/FEATURES.md) for the full list.

## Tech Stack

Go, gRPC, GraphQL, PostgreSQL, Redis, React, Tailwind CSS and more.  
👉 See [docs/TECH_STACK.md](docs/TECH_STACK.md) for details.
