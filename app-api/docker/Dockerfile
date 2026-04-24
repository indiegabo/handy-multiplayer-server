# app-api/docker/Dockerfile
# -----------------------------------------------------------------------------
# Strict Dockerfile for hms-api (NestJS) in a monorepo with npm workspaces.
# Stages:
#   - builder    : install deps, build app-shared-types, Admin SPA, and API
#   - production : runtime with compiled dist and pruned prod deps
#   - dev        : development image with watch/debug and app-shared-types watch
# -----------------------------------------------------------------------------

ARG ADMIN_BUILD_CONFIG=production

# -----------------------------------------------------------------------------
# Stage: builder
# -----------------------------------------------------------------------------
FROM node:22 AS builder
WORKDIR /workspace

ARG ADMIN_BUILD_CONFIG
RUN echo "ADMIN_BUILD_CONFIG=${ADMIN_BUILD_CONFIG}"

ENV npm_config_loglevel=warn \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=10000 \
    npm_config_fetch_retry_maxtimeout=600000 \
    npm_config_registry=https://registry.npmjs.org/

COPY package.json package-lock.json ./
COPY app-api/package.json app-api/package.json
COPY app-admin-panel/package.json app-admin-panel/package.json
COPY app-shared-types/package.json app-shared-types/package.json

RUN npm ci \
    --workspaces \
    --include-workspace-root=false \
    --no-audit --no-fund

COPY app-shared-types ./app-shared-types
RUN npm run -w @hms/shared-types build
WORKDIR /workspace

WORKDIR /workspace/app-api
COPY app-api/. ./
RUN npm run build && npx tsc-alias -p tsconfig.build.json

RUN test -f dist/main.js || ( \
  echo 'Missing dist/main.js' && ls -lah dist && exit 1 \
)

WORKDIR /workspace
RUN npm prune --omit=dev --workspaces --include-workspace-root=false

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
COPY --from=builder /workspace/app-api/dist ./dist
COPY --from=builder /workspace/app-shared-types /usr/src/app-shared-types
COPY --from=builder /workspace/app-api/package.json ./package.json

# Ensure email / view templates are available at runtime. The
# TemplateEngineService looks for `dist/templates` as a runtime
# candidate when running from the compiled distribution. Copying
# `src/templates` from the builder guarantees templates are present
# inside the production image.
COPY --from=builder /workspace/app-api/src/templates ./dist/templates

# Ensure local i18n assets are available in runtime image.
# SG i18n resolves from `dist/i18n/**` when running compiled code.
COPY --from=builder /workspace/app-api/src/i18n ./dist/i18n

RUN set -eux; \
    mkdir -p node_modules/@hms; \
    rm -rf node_modules/@hms/shared-types; \
    ln -sfn /usr/src/app-shared-types node_modules/@hms/shared-types; \
    node -e "require.resolve('@hms/shared-types'); console.log('app-shared-types resolvable')"

# Install runtime deps for app-shared-types so requires like `semver` resolve
RUN set -eux; \
        if [ -f /usr/src/app-shared-types/package.json ]; then \
            cd /usr/src/app-shared-types && npm install --omit=dev --no-audit --no-fund; \
        fi

RUN mkdir -p ./public/admin
# Admin panel is built and served by the separate `hms-admin-panel` service

COPY ./.env /usr/src/app/.env

RUN sh -lc 'test -f dist/main.js || (ls -lah dist && exit 1)'

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
COPY app-api/package.json app-api/package.json
COPY app-shared-types/package.json app-shared-types/package.json

RUN npm install -g typescript ts-node

RUN npm install \
    --workspaces \
    --include-workspace-root=true \
    --no-audit --no-fund

COPY .env ./.env
COPY app-api ./app-api
COPY app-shared-types ./app-shared-types

RUN set -eux; \
    mkdir -p node_modules/@hms; \
    rm -rf node_modules/@hms/shared-types; \
    ln -sfn /workspace/app-shared-types node_modules/@hms/shared-types; 

WORKDIR /workspace
CMD ["sh", "-lc", "\
  npm run -w @hms/api start:debug \
"]