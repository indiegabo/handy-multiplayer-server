# Environment Variables — Guide (HMS)

This document explains how HMS (Handy Multiplayer Server) reads environment variables
across **development**, **staging**, and **production**, how to create your `.env` from
the template, and how to generate strong secrets safely.

---

## Files and Loading Strategy

- `.env` (root): main environment file used by dev and during staging builds.
- `.env.template`: safe template to commit; contains placeholders only.
- **Staging images** copy `.env` **into the image at build time** (per Dockerfiles).  
  Compose files pass only minimal runtime values (ports and `NODE_ENV`).

> Never commit real secrets to the repository. Keep only `.env.template` in git.

---

## Create Your .env

1. Copy the template:
   ```bash
   cp .env.template .env
   ```
2. Replace all `CHANGE_ME_*` placeholders with secure values.
3. Ensure quotes are used if values contain spaces or special characters.

---

## Generating Strong Secrets

### JWT_SECRET (base64)

Generate a long base64-encoded string:

```bash
# Linux/macOS (OpenSSL)
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Set the output as `JWT_SECRET`.

### Passwords and Tokens

- Use at least 24–32 random characters.
- Prefer password managers to generate and store.
- If a value contains `#`, `$`, or spaces, wrap it in quotes in `.env`.

### Redis Password

- Use a strong secret and avoid exposing Redis to public networks.

---

## Environment-Specific Notes

### Development

- `docker-compose.yml` starts **hms-admin-panel** as a separate container with HMR.
- `hms-api` and `hms-system` run from source with live mounts.
- Databases and Redis run as containers.

### Staging

- `hms-api` image **embeds** the Admin SPA and serves it from `/admin-panel/`.
- `.env` is **copied** into the images during the build. Do not rely on bind mounts.
- Only minimal variables are passed by Compose (ports, `NODE_ENV`).
- Optional: use `docker-compose.staging.localdb.yml` to run Postgres/Mongo locally.

### Production

- Similar to staging; avoid exposing services directly.
- Rotate secrets regularly and restrict network access.

---

## Quick Checks

Validate Compose after editing `.env`:

```bash
docker compose config
```

Inspect health endpoints after startup:

```bash
curl -fsS http://localhost:${HMS_API_PORT:-80}/v1/health
curl -fsS http://localhost:${HMS_SYSTEM_PORT:-81}/v1/health
```

---

## Variable Reference (Summary)

- **Core**: `APP_NAME`, `APP_OWNER`, `APP_ENVIRONMENT`
- **Stack**: `STACK_*` (e.g., `hms-api`, `hms-system`, etc.)
- **Ports**: `HMS_API_PORT`, `HMS_SYSTEM_PORT`, `HMS_ADMIN_PANEL_PORT`
- **Internal**: `HMS_API_HOST`, `HMS_API_INTEROPS_HOST`, `HMS_API_INTEROPS_PORT`
- **DB (Main)**: `DB_MAIN_*` (host, port, db, user, passwords)
- **DB (Game)**: `DB_GAME_*` (host, port, db, replica set)
- **Redis**: `REDIS_*` (host, port, password, ttl)
- **Auth**: `JWT_SECRET`
- **Auth / Session**: `AUTH_ENFORCE_DEVICE_FP` (`true` by default)
- **Cloud (AWS)**: `AWS_*`
- **Twitch**: `TWITCH_*`
- **Discord**: `DISCORD_*`
- **Mail**: `MAIL_*`

For detailed deployment flows, see:

- `docs/staging.md` (staging deployment)
- `docs/maintenance.md` (maintenance scheduling and execution)
- `docs/resources/auth-session-refresh.md` (refresh/device policy)

---

## Full .env Template

For convenience, here is the full `.env.template` content ready to copy/paste into your text editor:

```
###############################################################################
# CORE APP
###############################################################################
APP_NAME="Handy Multiplayer Server"
APP_OWNER=lung-interactive
APP_ENVIRONMENT=development   # development | staging | production

###############################################################################
# STACK NAMING (container/image naming)
###############################################################################
STACK_NAME=handy-multiplayer-server
STACK_API=hms-api
STACK_SYSTEM=hms-system
STACK_ADMIN_PANEL=hms-admin-panel
STACK_REDIS=hms-redis
STACK_DB_MAIN=hms-db-main
STACK_DB_GAME=hms-db-game

###############################################################################
# PUBLIC PORTS (host → container mapping)
###############################################################################
# API (host port)
HMS_API_PORT=80

# System (host port)
HMS_SYSTEM_PORT=81

# Admin Panel (dev server only; not used in staging/prod)
HMS_ADMIN_PANEL_HOST=localhost
HMS_ADMIN_PANEL_PORT=82

###############################################################################
# INTERNAL ADDRESSES FOR GAME INSTANCES ↔ API (inside Docker networks)
###############################################################################
HMS_API_HOST=172.16.0.2
HMS_API_INTEROPS_HOST=172.16.0.2
HMS_API_INTEROPS_PORT=3000

###############################################################################
# DATABASES — MAIN (PostgreSQL)
###############################################################################
DB_MAIN_HOST=hms-db-main
DB_MAIN_PORT=5432
DB_MAIN_DATABASE=hms_main
DB_MAIN_USERNAME=hms_main_manager
DB_MAIN_SHOULD_LOG="no"

# Passwords (set strong values in your real .env)
DB_MAIN_PASSWORD=CHANGE_ME_DB_MAIN_PASSWORD
DB_MAIN_ADMIN_PASSWORD=CHANGE_ME_DB_MAIN_ADMIN_PASSWORD

###############################################################################
# DATABASES — GAME (MongoDB)
###############################################################################
DB_GAME_PORT=27017
DB_GAME_HOST=hms-db-game
DB_GAME_DATABASE=hms_game
DB_GAME_USERNAME=
DB_GAME_PASSWORD=
DB_GAME_REPLICA_SET=rs0

###############################################################################
# REDIS
###############################################################################
REDIS_HOST=hms-redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD
REDIS_DB=0
REDIS_TLS=false
REDIS_CACHE_TTL=3600

###############################################################################
# BUILD/DEV TOGGLES
###############################################################################
DOCKER_CLEAR_CACHE_FOR_BUILD=false

###############################################################################
# AUTH / SECRETS
###############################################################################
# Strong base64 string recommended (see docs/environment-variables.md)
JWT_SECRET=CHANGE_ME_LONG_BASE64_SECRET

# Device fingerprint check on authenticated requests.
# Keep "true" for strict security. Set "false" only as emergency fallback.
AUTH_ENFORCE_DEVICE_FP=true

###############################################################################
# CLOUD — AWS (optional)
###############################################################################
AWS_S3_BUCKET_NAME=handy-multiplayer-server
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=CHANGE_ME_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=CHANGE_ME_AWS_SECRET_ACCESS_KEY

###############################################################################
# THIRD-PARTY — TWITCH (optional)
###############################################################################
TWITCH_APP_ID=CHANGE_ME_TWITCH_APP_ID
TWITCH_APP_SECRET=CHANGE_ME_TWITCH_APP_SECRET
TWITCH_CALLBACK_URL=http://localhost/v1/auth/twitch/callback

###############################################################################
# THIRD-PARTY — DISCORD (optional)
###############################################################################
DISCORD_ENABLED=true
DISCORD_BOT_TOKEN=CHANGE_ME_DISCORD_BOT_TOKEN

###############################################################################
# MAIL
###############################################################################
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM="No Reply <no-reply@hms.local>"
```
