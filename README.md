# Aerogram API 🚀

Aerogram is a modern, high-performance messaging backend. It serves as a learning playground for building scalable systems using a **Hybrid API Architecture**: GraphQL for flexible client-side interactions and gRPC for robust, type-safe internal communication.



---

## 🏗 Architecture Overview

The project is structured to demonstrate real-world backend patterns:

* **Hybrid Gateway:** A central API that handles GraphQL queries/subscriptions and upgrades connections for WebSockets.
* **Internal gRPC Services:** Core business logic (Auth, Chat, Presence) is isolated into services that communicate via gRPC.
* **Real-time Core:** Redis-backed Pub/Sub manages user presence and instant message delivery.
-   **Middleware Layer:** Global authentication and session validation before reaching business logic.

---

## 🛠 Tech Stack

- **Backend:** [Go](https://go.dev/) (Golang)
- **Primary Database:** [PostgreSQL](https://www.postgresql.org/) + [GORM](https://gorm.io/)
- **Cache & Real-time:** [Redis](https://redis.io/) (Pub/Sub & TTL-based status)
- **API Interfaces:** - [gqlgen](https://github.com/99designs/gqlgen) (GraphQL)
  - [gRPC](https://grpc.io/) & [Protobuf](https://developers.google.com/protocol-buffers)
  - [Chi](https://github.com/go-chi/chi) (HTTP Routing)
- **Documentation:** [Swagger/OpenAPI](https://swagger.io/)

---
