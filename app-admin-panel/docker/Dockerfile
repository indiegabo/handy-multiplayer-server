# app-admin-panel/docker/Dockerfile
# -----------------------------------------------------------------------------
# Strict Dockerfile for hms-admin-panel (Angular) in a monorepo with
# npm workspaces. Development-only image: runs Angular dev server and watches
# @hms/shared-types for type changes.
#
# Stages:
#   - dev : development image with app-shared-types watch + ng serve
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Stage: dev
# -----------------------------------------------------------------------------
FROM node:22 AS dev

# Mirror monorepo layout inside the container.
WORKDIR /workspace

# Minimal tools
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# NPM config
ENV npm_config_loglevel=warn \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=10000 \
    npm_config_fetch_retry_maxtimeout=600000 \
    npm_config_registry=https://registry.npmjs.org/ \
    CHOKIDAR_USEPOLLING=true \
    CHOKIDAR_INTERVAL=1000 \
    WATCHPACK_POLLING=true

# Copy package manifests separately to leverage layer caching.
COPY app-shared-types/package.json app-shared-types/
COPY app-admin-panel/package.json app-admin-panel/

# Install global CLIs used by Angular dev server and TypeScript tooling.
RUN npm install -g @angular/cli typescript ts-node

# Install dependencies for shared types and admin panel separately.
WORKDIR /workspace/app-shared-types
RUN npm install --no-audit --no-fund

WORKDIR /workspace/app-admin-panel
RUN npm install --no-audit --no-fund

# Copy full sources after dependency install (better cache behavior).
WORKDIR /workspace
COPY app-shared-types ./app-shared-types
COPY app-admin-panel ./app-admin-panel

# Create symlink so the Angular app resolves the local shared-types package
# and make a workspace-level `node_modules` symlink so code importing
# `/workspace/node_modules/...` continues to work.
RUN set -eux; \
  mkdir -p /workspace/app-admin-panel/node_modules/@hms; \
  rm -rf /workspace/app-admin-panel/node_modules/@hms/shared-types || true; \
  ln -sfn /workspace/app-shared-types /workspace/app-admin-panel/node_modules/@hms/shared-types; \
  rm -rf /workspace/node_modules || true; \
  ln -sfn /workspace/app-admin-panel/node_modules /workspace/node_modules

# Sanity check
RUN node -e "console.log(require('path').resolve('/workspace/app-admin-panel/node_modules/@hms/shared-types'));"

# Expose and start dev server. Build/watch shared-types in background.
EXPOSE 4200
CMD ["sh", "-lc", "npm --prefix /workspace/app-shared-types run build:watch & npm --prefix /workspace/app-admin-panel run start:docker"]

# -----------------------------------------------------------------------------
# Stage: production
# -----------------------------------------------------------------------------
FROM node:22 AS admin-builder
WORKDIR /workspace

# Minimal tools
RUN apt-get update && \
  apt-get install -y curl && \
  rm -rf /var/lib/apt/lists/*

ENV npm_config_loglevel=warn \
  npm_config_fetch_retries=5 \
  npm_config_fetch_retry_mintimeout=10000 \
  npm_config_fetch_retry_maxtimeout=600000 \
  npm_config_registry=https://registry.npmjs.org/

# Copy package manifests and install per-package (no workspaces).
COPY app-shared-types/package.json app-shared-types/
COPY app-admin-panel/package.json app-admin-panel/

WORKDIR /workspace/app-shared-types
RUN npm install --no-audit --no-fund

WORKDIR /workspace/app-admin-panel
RUN npm install --no-audit --no-fund

# Copy sources
WORKDIR /workspace
COPY app-shared-types ./app-shared-types
COPY app-admin-panel ./app-admin-panel

# Ensure local resolution for shared-types, create workspace-level node_modules
# symlink and build production bundle.
RUN set -eux; \
  mkdir -p /workspace/app-admin-panel/node_modules/@hms; \
  rm -rf /workspace/app-admin-panel/node_modules/@hms/shared-types || true; \
  ln -sfn /workspace/app-shared-types /workspace/app-admin-panel/node_modules/@hms/shared-types; \
  rm -rf /workspace/node_modules || true; \
  ln -sfn /workspace/app-admin-panel/node_modules /workspace/node_modules; \
  cd /workspace/app-shared-types && npm run build && \
  cd /workspace/app-admin-panel && npx ng build --configuration production --base-href=/

FROM nginx:stable-alpine AS admin-production
COPY --from=admin-builder /workspace/app-admin-panel/dist/hms-admin-panel/browser/. /usr/share/nginx/html/
# Remove default snippet to prevent accidental inclusion of invalid
# directives (we will install a full nginx.conf as the main config).
RUN rm -f /etc/nginx/conf.d/default.conf || true

# The provided nginx.conf is a full nginx configuration file (includes
# `pid`, `events` and `http` blocks). Place it as the main nginx config
# rather than a conf.d snippet.
COPY app-admin-panel/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 CMD curl -f http://localhost/ || exit 1
