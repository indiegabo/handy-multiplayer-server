````markdown
# Docker Compose files — Locations and usage

This repository keeps the primary compose files at the repository root and
moves auxiliary/override compose files into `docker/compose/` to keep the root
clean. Use the examples below to run the desired combination of compose
files.

Locations

- Root (primary):
  - `docker-compose.yml` (development)
  - `docker-compose.production.yml` (production)

- Auxiliary (under `docker/compose/`):
  - `docker/compose/staging.yml`
  - `docker/compose/staging.localdb.yml`
  - `docker/compose/staging.localdb-4.4.yml`
  - `docker/compose/production.local-mongo.yml`
  - `docker/compose/pg-standalone.yml`
  - `docker/compose/pi-4.yml`
  - `docker/compose/utils.yml`

Why this layout

- Keeps the repository root easier to scan for most users.
- Groups optional variants and overrides inside `docker/compose/`.

Common usage examples

- Start default development stack (root compose):

```bash
docker compose up -d --build
```
````

- Start staging stack (use the staging compose located in `docker/compose`):

```bash
docker compose -f docker/compose/staging.yml up -d --build
```

- Combine base + override (recommended for staging with local DBs):

```bash
docker compose \
  -f docker-compose.yml \
  -f docker/compose/staging.localdb.yml \
  up -d --build
```

- Use `COMPOSE_FILE` for session convenience:

```bash
export COMPOSE_FILE=docker-compose.yml:docker/compose/staging.yml
docker compose up -d --build
```

Creating convenient scripts

- package.json scripts (example):

```json
"scripts": {
  "compose:staging": "docker compose -f docker-compose.yml -f docker/compose/staging.localdb.yml up -d --build",
  "compose:down": "docker compose -f docker-compose.yml -f docker/compose/staging.localdb.yml down"
}
```

- Makefile targets (example):

```makefile
staging:
  docker compose -f docker-compose.yml -f docker/compose/staging.localdb.yml up -d --build

down:
  docker compose -f docker-compose.yml -f docker/compose/staging.localdb.yml down
```

Symlink option (not recommended to commit)

- You can create a local symlink in the repo root that points to the
  file in `docker/compose/` for convenience:

```bash
ln -s docker/compose/staging.yml docker-compose.staging.yml
```

- Avoid committing such symlinks; prefer adding them to `.gitignore` or
  using developer-local scripts.

Notes and tips

- When combining files, order matters: later files override earlier ones.
- Keep secrets out of committed compose files; rely on `.env` and CI
  secret injection.

If you want, I can add convenient `npm` scripts or a `Makefile` targets
to the repo to standardize the most used compose commands.

```

```
