# Handy Multiplayer Server

A server solution for handling games with multiplayer capabilities based on NestJS and Angular

---

## 📚 Menu

- [🚀 Getting Started](#-getting-started)
- [🛠 Development Environment](#-development-environment)
- [📂 Project Structure](#-project-structure)
- [🐳 Docker Services Overview](#-docker-services-overview)
- <a href="docs/docker-compose.md" target="_blank">🧭 Docker Compose Files</a>
- [Docker Compose folder](docker/compose)
- [💻 Shared Types](#-shared-types)
- <a href="docs/environment-variables.md" target="_blank">📑 Environment Variables 🔗</a>
- [🌟 Features](#-features)
- <a href="docs/maintenance.md" target="_blank">⚙️ Maintenance 🔗</a>
- <a href="docs/staging.md" target="_blank">🧪 Staging (How-To) 🔗</a>
- <a href="docs/launcher-socket-integration.md" target="_blank">🔌 Launcher Socket / Redis Integration</a>
- <a href="docs/resources/i18n-hms-api-integration.md" target="_blank">🌐 I18n API Integration (HMS)</a>
- <a href="docs/media-associations-and-image-dto.md" target="_blank">🖼 Media Associations and ImageDTO</a>
- <a href="docs/game-images-backoffice-and-public-api.md" target="_blank">🎮 Game Images (Backoffice + Public API)</a>
- [📝 Notes](#-notes)

---

## 🚀 Getting Started

### Prerequisites

- Docker
- Docker Compose

---

## 🛠 Development Environment

The **development environment** is orchestrated by Docker Compose.  
When running locally, the stack includes the following:

- **hms-admin-panel**: runs the Angular Admin Panel as a separate container, with hot-reload.
- **hms-api** and **hms-system**: both NestJS services run in containers with live mounts.
- **Databases and Redis**: also run in containers.

> ⚠️ In **production/staging**, the Admin Panel is not a separate service.  
> It is built during the `hms-api` image build process and served as static files directly by the NestJS application.

### Practical commands

Start the development environment:

```
docker compose up -d --build
```

Stop and remove all services, including volumes:

```
docker compose down -v
```

Other useful commands:

- View logs of all services:

  ```
  docker compose logs -f
  ```

- View logs of a specific service (example: hms-api):

  ```
  docker compose logs -f hms-api
  ```

- Restart a single service (example: hms-system):

  ```
  docker compose restart hms-system
  ```

- Rebuild a specific service without affecting others (example: hms-admin-panel):

  ```
  docker compose build hms-admin-panel
  docker compose up -d hms-admin-panel
  ```

- Enter a container’s shell (example: hms-api):
  ```
  docker exec -it hms-api sh
  ```

---

## 📂 Project Structure

```
project/
├── app-admin-panel            # Angular admin panel UI
├── app-api                    # Core NestJS application (API and game management)
├── app-shared-types           # Shared TypeScript types across all apps
├── app-system                 # System monitoring and status service
├── docker-compose.yml         # Development configuration
├── docker-compose.prod.yml    # Production configuration
└── docs/                      # Documentation (guides, how-tos)

```

---

## 🐳 Docker Services Overview

The system is composed of several interconnected services:

### Core Services

- **app-api**:
  - NestJS application handling API requests and game instance management
  - Connects to PostgreSQL and Redis

- **app-system**:
  - Independent system monitoring service
  - Handles system health and metrics

- **hms-admin**:
  - Angular-based admin interface
  - Communicates with app-api
  - Allow admins to handle several features such as users,
    online game instances, lobbies and more.

### Data Services

- **hms-redis**:
  - Redis 7.2.5 for caching and pub/sub
  - Persistent volume for data storage

- **hms-db-main**:
  - PostgreSQL 16.3 for main data storage
  - Initialization scripts for database setup

- **hms-db-game**:
  - MongoDB 7.0.12 for game-specific data
  - Configured with replica set for scalability

### Networking

- **hms-network**:
  - Bridge network for core service communication
- **hms-internal-network**:
  - Dedicated subnet (172.16.0.0/21) for game instances
  - Fixed IP assignments for core services

---

## 💻 Shared Types

The folder **`app-shared-types/`** contains TypeScript definitions and interfaces that are reused by all three applications:

- **app-admin-panel** (Angular frontend)
- **app-api** (NestJS backend API)
- **app-system** (NestJS system monitoring service)

These shared types ensure that data contracts remain consistent across the entire platform.  
Path mapping is configured in each project’s `tsconfig.json`, allowing types to be imported using the package alias published in the monorepo:

```ts
import { ApiResponse, UserViewDto } from "@hms/shared-types";
```

This approach avoids code duplication and prevents type mismatches between the services.

---

## 🌟 Features

- Real-time game streaming
- Multiplayer capabilities
- Scalable containerized architecture
- Separate networks for core services and game instances
- Comprehensive monitoring system

---

## 📝 Notes

- Make sure to configure environment variables for production
- The system uses dedicated volumes for persistent data storage
