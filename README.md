# Messenger App

![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go) ![React Version](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css) ![License](https://img.shields.io/badge/license-Apache-green)

A full-stack, real-time messenger application built with a focus on performance and scalable architecture. This project implements a monorepo structure containing a Go-based GraphQL/gRPC backend and a React-based frontend.

---

## 🚀 Features

* **Secure Authentication**: Email verification via OTP (One-Time Password) powered by Resend.
* **Real-time Messaging**: High-performance communication with focused low latency.
* **Chat Management**: Dynamic chat lists, global user search, and profile management.
* **Hybrid API Architecture**: Leveraging GraphQL for flexible data fetching and gRPC for efficient service communication.
* **Type Safety**: Full-stack type safety using Zod (frontend) and Protobuf/GQLGen (backend).

---

## 🛠 Tech Stack

### Backend (Go)
* **API**: `chi` (Router), `99designs/gqlgen` (GraphQL)
* **Storage**: `PostgreSQL` (GORM), `Redis` (Caching & Pub/Sub)
* **Communication**: `gRPC` + `Protobuf` (managed via Buf)
* **Infrastructure**: `Viper`, `godotenv`, `google/uuid`
* **Email**: `Resend API`

### Frontend (React)
* **State & Logic**: `Zustand`, `TanStack Query` (React Query)
* **UI & Forms**: `Tailwind CSS`, `React Hook Form` + `Zod`
* **Build Tool**: `Vite`

---
