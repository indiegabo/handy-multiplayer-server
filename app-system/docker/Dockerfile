# app-system/docker/Dockerfile
# -----------------------------------------------------------------------------
# Strict Dockerfile for hms-system (NestJS) in a monorepo with npm workspaces.
# Works for development (watch/debug) and production (runtime).
# No fallbacks: service must emit dist/main.js.
#
# Stages:
#   - builder    : install deps, build @hms/shared-types and the service
#   - production : minimal runtime with compiled dist and pruned prod deps
#   - dev        : development image with watch/debug and app-shared-types watch
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Stage: builder (PRODUCTION ONLY)
# -----------------------------------------------------------------------------
FROM node:22 AS builder

WORKDIR /workspace

ENV npm_config_loglevel=warn \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=10000 \
    npm_config_fetch_retry_maxtimeout=600000 \
    npm_config_registry=https://registry.npmjs.org/

COPY package.json package-lock.json ./
COPY app-system/package.json app-system/package.json
COPY app-shared-types/package.json app-shared-types/package.json

RUN npm ci \
    --workspaces \
    --include-workspace-root=false \
    --no-audit --no-fund

COPY app-shared-types ./app-shared-types
RUN npm run -w @hms/shared-types build

WORKDIR /workspace/app-system
COPY app-system/tsconfig.json ./tsconfig.json
COPY app-system/tsconfig.build.json ./tsconfig.build.json
COPY app-system/. ./
RUN npm run build

RUN test -f dist/main.js || ( \
  echo "Build failed: missing dist/main.js. Check tsconfig rootDir/outDir." && \
  exit 1 \
)

WORKDIR /workspace
RUN npm prune --omit=dev

# -----------------------------------------------------------------------------
# Stage: production (runtime)
# -----------------------------------------------------------------------------
FROM node:22 AS production

WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

ENV npm_config_loglevel=warn \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=10000 \
    npm_config_fetch_retry_maxtimeout=600000 \
    npm_config_registry=https://registry.npmjs.org/

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/app-system/dist ./dist
COPY --from=builder /workspace/app-shared-types/dist /usr/src/app-shared-types/dist
COPY --from=builder /workspace/app-shared-types/package.json /usr/src/app-shared-types/package.json
COPY --from=builder /workspace/app-system/package.json ./package.json

# Ensure runtime dependencies of app-shared-types are installed in its own folder
RUN set -eux; \
    if [ -f /usr/src/app-shared-types/package.json ]; then \
      cd /usr/src/app-shared-types && npm install --omit=dev --no-audit --no-fund; \
    fi

RUN set -eux; \
    mkdir -p node_modules/@hms; \
    rm -rf node_modules/@hms/shared-types; \
    ln -sfn /usr/src/app-shared-types node_modules/@hms/shared-types; \
    node -e "require.resolve('@hms/shared-types'); console.log('app-shared-types resolvable')"

COPY ./.env /usr/src/app/.env

RUN sh -lc '\
  if [ -f dist/main.js ]; then \
    echo "Found entrypoint: dist/main.js"; \
  else \
    echo "No entrypoint at dist/main.js. Contents of dist/:" && \
    ls -lah dist && exit 1; \
  fi \
'

CMD ["sh", "-lc", "\
  npm run start:prod \
"]

# -----------------------------------------------------------------------------
# Stage: dev
# -----------------------------------------------------------------------------
FROM node:22 AS dev
WORKDIR /workspace

RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY app-system/package.json app-system/package.json
COPY app-shared-types/package.json app-shared-types/package.json

RUN npm install -g typescript ts-node

RUN npm install \
    --workspaces \
    --include-workspace-root=true \
    --no-audit --no-fund

COPY .env ./.env
COPY app-system ./app-system
COPY app-shared-types ./app-shared-types

RUN set -eux; \
    mkdir -p node_modules/@hms; \
    rm -rf node_modules/@hms/shared-types; \
    ln -sfn /workspace/app-shared-types node_modules/@hms/shared-types; 

WORKDIR /workspace
CMD ["sh", "-lc", "\
  npm run -w @hms/system start:debug \
"]