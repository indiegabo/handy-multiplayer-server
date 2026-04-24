# Staging — Deployment Guide

This guide explains how to publish the **staging** version of HMS.  
In staging, the **API** serves the **Admin SPA** as static files (base route `/admin-panel/`),
and only **Redis** runs as an additional container by default. PostgreSQL and MongoDB can be
external or optionally enabled locally via an override file.

---

## Overview

- Main file: `docker-compose.staging.yml`
- Optional override (local Postgres/Mongo/Mailhog): `docker-compose.staging.localdb.yml`
- Images are **multi-stage** with target `staging`:
  - `hms-api`: builds Angular Admin and embeds it in `public/admin`
  - `hms-system`: production runtime using the compiled `dist/`
- The repository-root `.env` is **copied into the images** and read at runtime.
- Compose variables are kept **minimal** (ports and `NODE_ENV`) for staging.
- **Maintenance procedure** is documented in: [`docs/maintenance.md`](./maintenance.md).

---

## Prerequisites

- **Docker** and **Docker Compose**
- `.env` at the repo root with at least:

Take a look at the maintenance procedure to understand how to increment new
versions of your server.

- <a href="../docs/maintenance.md" target="_blank">⚙️ Maintenance 🔗</a>

> Note: In the default staging setup, Postgres/Mongo may be external/managed.  
> Use `docker-compose.staging.localdb.yml` to run them locally if needed.

---

## Build Images (staging)

`docker-compose.staging.yml` selects the `staging` target in the Dockerfiles and sets Angular
to build with `--base-href=/admin-panel/` via `ADMIN_BUILD_CONFIG=staging`.

Build all images:

```bash
docker compose -f docker-compose.staging.yml build
```

---

## Bring Up Staging (default: Redis + API + System)

```bash
docker compose -f docker-compose.staging.yml up -d --build
```

Exposed services:

- **HMS API**  
  Host: `http://localhost:${HMS_API_PORT:-80}`  
  Healthcheck: `/v1/health`  
  Admin SPA: `http://localhost:${HMS_API_PORT:-80}/admin-panel/`

- **HMS System**  
  Host: `http://localhost:${HMS_SYSTEM_PORT:-81}`  
  Healthcheck: `/v1/health`

- **Redis**  
  Internal (fixed IP on `hms-internal-network`: `172.16.0.4`)  
  Requires `REDIS_PASSWORD`.

> Reserved IPs on `hms-internal-network`: API `172.16.0.2`, SYSTEM `172.16.0.3`, REDIS `172.16.0.4`.

---

## Bring Up Staging with Local DBs (override)

```bash
docker compose -f docker-compose.staging.yml -f docker-compose.staging.localdb.yml up -d --build
```

Additional services:

- **Postgres (hms-db-main)** on `${DB_MAIN_PORT:-5432}`
- **MongoDB (hms-db-game)** on `${DB_GAME_PORT:-27017}`, replicaset `rs0`
- **Mailhog** UI at `http://localhost:8025` (SMTP `1025`)

The override also adjusts `depends_on` so API/SYSTEM wait for DBs/Mailhog.

---

## Post-Deploy Checks

1. **Healthchecks**
   - API: `curl -fsS http://localhost:${HMS_API_PORT:-80}/v1/health`
   - SYSTEM: `curl -fsS http://localhost:${HMS_SYSTEM_PORT:-8081}/v1/health`

2. **Admin SPA**
   - `http://localhost:${HMS_API_PORT:-80}/admin-panel/`

3. **Redis**
   - Authenticated PING:
     ```bash
     docker exec -it hms-redis redis-cli -a "$REDIS_PASSWORD" PING
     ```

---

## Updating Staging (API and System only)

### Default stack (Redis + API + System)

**Rebuild only API and System images:**

```bash
docker compose -f docker-compose.staging.yml   build hms-api hms-system
```

**Recreate only API and System containers (leave others running):**

```bash
docker compose -f docker-compose.staging.yml   up -d --no-deps hms-api hms-system
```

> Tip: to rebuild without cache, add `--no-cache` to the `build` command.

---

### With local DBs override

**Rebuild only API and System images:**

```bash
docker compose -f docker-compose.staging.yml   -f docker-compose.staging.localdb.yml   build hms-api hms-system
```

**Recreate only API and System containers (leave others running):**

```bash
docker compose -f docker-compose.staging.yml   -f docker-compose.staging.localdb.yml   up -d --no-deps hms-api hms-system
```

---
