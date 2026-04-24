# Admin Panel - Local development and Docker

This document explains how to bootstrap and run the admin panel independently
from the monorepo root. The admin panel depends on the `@hms/shared-types`
package which lives in `../app-shared-types`.

## Bootstrap (local, isolated)

1. Build or install the shared types package:

```bash
cd app-shared-types
npm install
npm run build
```

2. Install admin panel dependencies and run the dev server:

```bash
cd ../app-admin-panel
npm install
npm run start
```

Alternatively, you can run the shared-types build and admin server together
using `npm --prefix` from the repo root:

```bash
npm --prefix app-shared-types run build:watch & npm --prefix app-admin-panel run start -- --host 0.0.0.0 --port 4200
```

## Docker (build and run)

Build only the admin panel image (from repository root):

```bash
docker compose build hms-admin-panel
```

Run the admin panel together with other services defined in
`docker-compose.yml`:

```bash
docker compose up hms-admin-panel
```

To run the full stack:

```bash
docker compose up --build
```

## Notes

- The Dockerfile expects the repository layout where `app-admin-panel` and
  `app-shared-types` are present at the repository root. The image builds the
  shared-types first and symlinks it into the admin panel `node_modules` so
  local types resolve correctly.
- For local development you can prefer `npm --prefix` commands to avoid
  changing the root `package.json` workspace settings.
