#!/usr/bin/env bash
# Restart admin panel helper
#
# Stops, rebuilds and restarts the admin-panel docker-compose service only.
# Designed to be simple and focused (no other services are touched).
#
# Environment variables:
#   ADMIN_SERVICE  - docker compose service name for admin panel
#                    (default: auto-detected or "app-admin-panel")
#   COMPOSE_FILE   - compose file to use (default: docker-compose.yml)
#   DRY_RUN        - if set to "true", commands are printed but not executed
#   TIMEOUT        - seconds to wait for stop/start checks (default: 60)
#
# Examples:
#   DRY_RUN=true ./scripts/restart-admin-panel.sh
#   ADMIN_SERVICE=hms-admin-panel ./scripts/restart-admin-panel.sh
#   COMPOSE_FILE=docker-compose.production.yml ./scripts/restart-admin-panel.sh

set -euo pipefail

# Defaults
ADMIN_SERVICE="${ADMIN_SERVICE:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
DRY_RUN="${DRY_RUN:-false}"
TIMEOUT="${TIMEOUT:-60}"

log() { echo "[restart-admin] $*"; }

run() {
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] $*"
  else
    eval "$*"
  fi
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[restart-admin] Missing required command: $cmd" >&2
    exit 4
  fi
}

preflight_checks() {
  log "Running preflight checks"
  require_command docker
  if ! docker compose version >/dev/null 2>&1; then
    echo "[restart-admin] Missing required command: docker compose" >&2
    exit 4
  fi
}

detect_admin_service() {
  # If ADMIN_SERVICE already set, keep it
  if [ -n "$ADMIN_SERVICE" ]; then
    return 0
  fi

  # If compose file missing, fallback to sensible default
  if [ ! -f "$COMPOSE_FILE" ]; then
    ADMIN_SERVICE="app-admin-panel"
    return 0
  fi

  local svc=""
  while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]{2}([a-zA-Z0-9._-]+): ]]; then
      svc="${BASH_REMATCH[1]}"
      local lname
      lname="$(echo "$svc" | tr '[:upper:]' '[:lower:]')"
      if [[ $lname == *"admin"* || $lname == *"panel"* || $lname == *"app-admin"* ]]; then
        ADMIN_SERVICE="$svc"
        return 0
      fi
    fi
  done < "$COMPOSE_FILE"

  # final fallback
  ADMIN_SERVICE="app-admin-panel"
}

wait_for_service_stopped() {
  local service="$1"
  local timeout_seconds="${2:-60}"
  local elapsed=0

  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    local container_id
    container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || true)"

    if [ -z "$container_id" ]; then
      return 0
    fi

    local running
    running="$(docker inspect -f '{{.State.Running}}' "$container_id" 2>/dev/null || echo false)"
    if [ "$running" != "true" ]; then
      return 0
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  echo "[restart-admin] ERROR: Service '$service' did not stop within ${timeout_seconds}s." >&2
  return 1
}

wait_for_service_running() {
  local service="$1"
  local timeout_seconds="${2:-60}"
  local elapsed=0

  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    local container_id
    container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || true)"
    if [ -n "$container_id" ]; then
      local running
      running="$(docker inspect -f '{{.State.Running}}' "$container_id" 2>/dev/null || echo false)"
      if [ "$running" = "true" ]; then
        return 0
      fi
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  echo "[restart-admin] ERROR: Service '$service' did not start within ${timeout_seconds}s." >&2
  return 1
}

# ----- main
preflight_checks

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "[restart-admin] Compose file '$COMPOSE_FILE' not found." >&2
  exit 2
fi

detect_admin_service

log "Admin service resolved to: $ADMIN_SERVICE (compose: $COMPOSE_FILE)"

log "Stopping service: $ADMIN_SERVICE"
run "docker compose -f \"$COMPOSE_FILE\" stop \"$ADMIN_SERVICE\""

if [ "$DRY_RUN" != "true" ]; then
  wait_for_service_stopped "$ADMIN_SERVICE" "$TIMEOUT" || true
  log "Confirmed service stopped: $ADMIN_SERVICE"
fi

log "Building service: $ADMIN_SERVICE"
run "docker compose -f \"$COMPOSE_FILE\" build \"$ADMIN_SERVICE\""

log "Starting service: $ADMIN_SERVICE"
run "docker compose -f \"$COMPOSE_FILE\" up -d \"$ADMIN_SERVICE\""

if [ "$DRY_RUN" != "true" ]; then
  wait_for_service_running "$ADMIN_SERVICE" "$TIMEOUT" || true
  log "Service is running: $ADMIN_SERVICE"
fi

log "Restart sequence completed for: $ADMIN_SERVICE"

exit 0
