# Maintenance — Scheduling and Execution

This document describes how **maintenance windows** are scheduled and executed in HMS.

---

## Scheduling Maintenance (Admin Panel)

1. Open the Admin Panel and navigate to **`/system/maintenance`**.  
2. Click **Start Maintenance**. A dialog/view will ask **when** the maintenance should start.  
3. Confirm the time window. The Admin Panel will send a request to **`/start-maintenance`** 
   with the scheduled delay.  
4. After scheduling:
   - **hms-system** broadcasts a **Socket.IO event** to all connected clients so they are aware
     of the upcoming maintenance.  
   - If **Discord integration** is configured, **hms-system** posts a message announcing that
     maintenance has been scheduled and will start in *X* minutes.

---

## Automatic Actions at Start Time

When the scheduled time elapses, **hms-system** automatically starts the maintenance process:

- Stops the **hms-api** Docker service.  
- Notifies Discord (if enabled) that the **deploy team** can proceed.  

> ⚠️ **Do not stop Redis.**  
> Redis holds state about the maintenance workflow. Bringing it down disrupts coordination.

---

## Deploy Team Tasks (while maintenance is active)

While **hms-api** is down and **hms-system** remains up, the deploy team should:

1. **Update source code** (example assumes `main` branch):
   ```bash
   git fetch --all --prune
   git checkout main
   git pull --ff-only
   ```

2. **Rebuild images** (only API/System) — **do not** bring Redis down:

   - Staging without local DB override:

   ```bash
   docker compose -f docker-compose.staging.yml build hms-api hms-system
   ```

   - If you are using the local DB override:

   ```bash
   docker compose      
      -f docker-compose.staging.yml      
      -f docker-compose.staging.localdb.yml      
      build hms-api hms-system
   ```

3. **Restart API/System only** (keep Redis running):

   - Staging without local DB override:
   
   ```bash
   docker compose 
      -f docker-compose.staging.yml 
      up -d hms-api hms-system
   ```
   
   - With local DB override:

   ```bash
   docker compose      
      -f docker-compose.staging.yml      
      -f docker-compose.staging.localdb.yml      
      up -d hms-api hms-system
   ```

4. **Monitor logs** and healthchecks:
   ```bash
   docker compose logs -f hms-api
   docker compose logs -f hms-system
   curl -fsS http://localhost:${HMS_API_PORT:-80}/v1/health
   curl -fsS http://localhost:${HMS_SYSTEM_PORT:-8081}/v1/health
   ```

> Tips:
> - Avoid `docker compose down` during maintenance; it would stop Redis.  
> - Use targeted `build`/`up` commands for `hms-api` and `hms-system` only.  
> - If a rollback is needed, check out the previous tag/commit and repeat the build/up steps.

---

## Automatic Recovery (leaving maintenance)

When services come back up:

- **hms-system** detects that the platform is returning from maintenance and **waits** for
  **hms-api** to finish its boot sequence.  
- **hms-api** runs its startup pipeline:
  - Database **migrations**
  - **Seeding** (if enabled)
  - Registered initialization steps via the `@InitStep()` decorator
- If everything completes successfully, **hms-api** signals **hms-system** that the platform
  is healthy again and **maintenance mode ends**.

---

## Quick Command Reference

Update, rebuild API/System, and restart (no DB override):

```bash
git fetch --all --prune
git checkout main
git pull --ff-only

docker compose -f docker-compose.staging.yml build hms-api hms-system
docker compose -f docker-compose.staging.yml up -d hms-api hms-system

docker compose logs -f hms-api
docker compose logs -f hms-system
```

With local DB override:

```bash
git fetch --all --prune
git checkout main
git pull --ff-only

docker compose 
   -f docker-compose.staging.yml 
   -f docker-compose.staging.localdb.yml   
   build hms-api hms-system

docker compose 
   -f docker-compose.staging.yml 
   -f docker-compose.staging.localdb.yml   
   up -d hms-api hms-system

docker compose logs -f hms-api
docker compose logs -f hms-system

---

## Automated maintenance script

An automation helper script is available at `scripts/maintenance.sh` to
perform a typical maintenance sequence: update git, stop the admin
service, rebuild and restart the API and admin services using a specific
docker-compose file.

Usage examples:

``bash
# make the script executable (one-time):
chmod +x scripts/maintenance.sh

# run with defaults:
./scripts/maintenance.sh

# override defaults (example):
API_SERVICE=hms-api \
   ADMIN_SERVICE=hms-admin \
   COMPOSE_FILE=docker-compose.production.yml \
   ./scripts/maintenance.sh

# dry-run (prints commands instead of executing):
DRY_RUN=true ./scripts/maintenance.sh
``

Environment variables:

- `API_SERVICE`: service name to rebuild for the API (default: `app-api`).
- `ADMIN_SERVICE`: service name for admin panel (default: `app-admin-panel`).
- `COMPOSE_FILE`: path to docker-compose file (default: `docker-compose.production.yml`).
- `DRY_RUN`: set to `true` to print commands without executing.

Notes:

- The script assumes it is placed under the repository `scripts/` folder
   and is run from the repo root (the script will `cd` into the repo
   root automatically).
- The script uses `docker compose -f <file> ...` to operate on the
   specified compose file.
- If `git pull --ff-only` fails the script will attempt a default
   `git pull` fallback.

Git SSH key support

You can provide a specific SSH private key for the script to use when
pulling from the Git remote by setting the `GIT_SSH_KEY` environment
variable to the path of the private key. The script will retry `git
pull` using that key if the initial pull fails due to SSH auth issues.

Example:

``bash
GIT_SSH_KEY=~/.ssh/id_ed25519_sgserver_1774382506 ./scripts/maintenance.sh
``

The script will also auto-detect the key at
`~/.ssh/id_ed25519_sgserver_1774382506` if present and use it
automatically.
```
