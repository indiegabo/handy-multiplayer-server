#!/usr/bin/env bash
# Maintenance automation script.
#
# Usage examples:
#   # make executable (once)
#   chmod +x scripts/maintenance.sh
#
#   # run with defaults
#   ./scripts/maintenance.sh
#
#   # override service names or compose file
#   API_SERVICE=hms-api \
#     ADMIN_SERVICE=hms-admin \
#     COMPOSE_FILE=docker-compose.production.yml \
#     ./scripts/maintenance.sh
#
# Environment variables:
#   API_SERVICE    - Service name for API (auto-detected by default)
#   ADMIN_SERVICE  - Service name for admin panel (auto-detected by default)
#   REDIS_SERVICE  - Service name for Redis (auto-detected by default)
#   COMPOSE_FILE   - Compose file to use (default: docker-compose.production.yml)
#   DRY_RUN        - if set to "true", commands are printed but not executed
#   AUTO_INSTALL_SYSTEM_DEPS - if "true", installs Node.js/npm when missing
#   AUTO_BUILD_SHARED_TYPES - if "true", builds app-shared-types when dist is missing
#   CLEAN_ORPHANS - if "true", prunes orphan containers/volumes/images at the end

set -euo pipefail

# Defaults
API_SERVICE="${API_SERVICE:-}"
ADMIN_SERVICE="${ADMIN_SERVICE:-}"
SYSTEM_SERVICE="${SYSTEM_SERVICE:-}"
REDIS_SERVICE="${REDIS_SERVICE:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
DRY_RUN="${DRY_RUN:-false}"
GIT_SSH_KEY="${GIT_SSH_KEY:-}"
AUTO_INSTALL_DEPS="${AUTO_INSTALL_DEPS:-true}"
AUTO_INSTALL_SYSTEM_DEPS="${AUTO_INSTALL_SYSTEM_DEPS:-true}"
AUTO_BUILD_SHARED_TYPES="${AUTO_BUILD_SHARED_TYPES:-true}"
CLEAN_ORPHANS="${CLEAN_ORPHANS:-true}"
SKIP_PULL="${SKIP_PULL:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"

# CLI flags parsing (also allow env vars SKIP_PULL=1/true and SKIP_TESTS=1/true)
while [ "$#" -gt 0 ]; do
  case "$1" in
    --skip-pull)
      SKIP_PULL=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--skip-pull] [--skip-tests]" >&2
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

# Error handling
on_error() {
  echo "[maintenance] ERROR: An error occurred during maintenance." >&2
  exit 1
}
trap 'on_error' ERR

# Helpers
log() { echo "[maintenance] $*"; }
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
    echo "[maintenance] Missing required command: $cmd" >&2
    exit 4
  fi
}

ensure_node_and_npm() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  log "Node.js/npm not found."

  if [ "$AUTO_INSTALL_SYSTEM_DEPS" != "true" ]; then
    echo "[maintenance] Missing required command: npm" >&2
    echo "[maintenance] Set AUTO_INSTALL_SYSTEM_DEPS=true to install it." >&2
    exit 4
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    echo "[maintenance] npm is missing and apt-get is unavailable." >&2
    echo "[maintenance] Install Node.js/npm manually for this OS." >&2
    exit 4
  fi

  local sudo_cmd=""
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
      sudo_cmd="sudo"
    else
      echo "[maintenance] npm is missing and root access is required." >&2
      echo "[maintenance] Re-run as root or install sudo." >&2
      exit 4
    fi
  fi

  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] ${sudo_cmd:+$sudo_cmd }apt-get update"
    echo "[DRY RUN] ${sudo_cmd:+$sudo_cmd }apt-get install -y nodejs npm"
    return 0
  fi

  log "Installing system dependencies: nodejs npm"
  if [ -n "$sudo_cmd" ]; then
    "$sudo_cmd" apt-get update
    "$sudo_cmd" apt-get install -y nodejs npm
  else
    apt-get update
    apt-get install -y nodejs npm
  fi

  require_command node
  require_command npm
}

ensure_dependencies() {
  if [ -d "node_modules" ]; then
    return 0
  fi

  log "Dependencies not found (node_modules missing)."

  if [ "$AUTO_INSTALL_DEPS" != "true" ]; then
    echo "[maintenance] Set AUTO_INSTALL_DEPS=true to install dependencies." >&2
    exit 5
  fi

  if [ "$DRY_RUN" = "true" ]; then
    if [ -f "package-lock.json" ]; then
      echo "[DRY RUN] npm ci"
    else
      echo "[DRY RUN] npm install"
    fi
    return 0
  fi

  if [ -f "package-lock.json" ]; then
    log "Installing dependencies with npm ci"
    npm ci
  else
    log "package-lock.json not found, installing dependencies with npm install"
    npm install
  fi
}

ensure_shared_types() {
  if [ ! -d "app-shared-types" ]; then
    return 0
  fi

  if [ -f "app-shared-types/dist/index.js" ] && [ -f "app-shared-types/dist/index.d.ts" ]; then
    return 0
  fi

  log "Shared types build output not found (app-shared-types/dist)."

  if [ "$AUTO_BUILD_SHARED_TYPES" != "true" ]; then
    echo "[maintenance] Build shared types manually or set AUTO_BUILD_SHARED_TYPES=true." >&2
    exit 6
  fi

  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] npm run shared:build"
    return 0
  fi

  log "Building shared types package"
  npm run shared:build
}

preflight_checks() {
  log "Running preflight checks"

  require_command git
  require_command docker
  ensure_node_and_npm

  if ! docker compose version >/dev/null 2>&1; then
    echo "[maintenance] Missing required command: docker compose" >&2
    exit 4
  fi

  ensure_dependencies
  ensure_shared_types
}

# Determine repo root (assumes script lives in <repo>/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

preflight_checks

# Validate compose file
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "[maintenance] Compose file '$COMPOSE_FILE' not found in $REPO_ROOT" >&2
  exit 2
fi

# Attempt to detect service names from compose file and .env when not set
detect_services() {
  if [ -n "$API_SERVICE" ] && [ -n "$ADMIN_SERVICE" ] && [ -n "$SYSTEM_SERVICE" ] && [ -n "$REDIS_SERVICE" ]; then
    return 0
  fi

  local svc=""
  local container_line=""
  while IFS= read -r line; do
    # detect service key lines (two-space indentation followed by name:)
    if [[ $line =~ ^[[:space:]]{2}([a-zA-Z0-9._-]+): ]]; then
      svc="${BASH_REMATCH[1]}"
      continue
    fi

    # detect container_name lines and map them to the last service seen
    if [[ "$line" == *container_name:* ]]; then
      container_line=$(echo "$line" | sed -E 's/^[[:space:]]*container_name:[[:space:]]*"?([^\"]+)"?.*/\1/')
      # If container references STACK_API/STACK_ADMIN_PANEL, map it
      if [[ "$container_line" == *STACK_API* ]] && [ -z "$API_SERVICE" ]; then
        API_SERVICE="$svc"
      fi
      if [[ "$container_line" == *STACK_ADMIN_PANEL* ]] && [ -z "$ADMIN_SERVICE" ]; then
        ADMIN_SERVICE="$svc"
      fi
      if [[ "$container_line" == *STACK_SYSTEM* ]] && [ -z "$SYSTEM_SERVICE" ]; then
        SYSTEM_SERVICE="$svc"
      fi
      if [[ "$container_line" == *STACK_REDIS* ]] && [ -z "$REDIS_SERVICE" ]; then
        REDIS_SERVICE="$svc"
      fi
    fi
  done < "$COMPOSE_FILE"

  # Fallback heuristics: look for service keys containing "api" / "admin"
  if [ -z "$API_SERVICE" ] || [ -z "$ADMIN_SERVICE" ]; then
    while IFS= read -r line; do
      if [[ $line =~ ^[[:space:]]{2}([a-zA-Z0-9._-]+): ]]; then
        name="${BASH_REMATCH[1]}"
        lname="$(echo "$name" | tr '[:upper:]' '[:lower:]')"
        if [[ -z "$API_SERVICE" ]] && [[ $lname == *"api"* || $lname == *"hms-api"* || $lname == *"app-api"* ]]; then
          API_SERVICE="$name"
        fi
        if [[ -z "$ADMIN_SERVICE" ]] && [[ $lname == *"admin"* || $lname == *"panel"* ]]; then
          ADMIN_SERVICE="$name"
        fi
        if [[ -z "$SYSTEM_SERVICE" ]] && [[ $lname == *"system"* || $lname == *"hms-system"* ]]; then
          SYSTEM_SERVICE="$name"
        fi
        if [[ -z "$REDIS_SERVICE" ]] && [[ $lname == *"redis"* ]]; then
          REDIS_SERVICE="$name"
        fi
      fi
    done < "$COMPOSE_FILE"
  fi

  # As a last resort, try to read STACK_* variables from .env and map to service
  if [ -f .env ]; then
    # load only STACK_API and STACK_ADMIN_PANEL if present
    STACK_API_VAL="$(grep -E '^STACK_API=' .env | head -n1 | cut -d'=' -f2- | tr -d '"')" || true
    STACK_ADMIN_VAL="$(grep -E '^STACK_ADMIN_PANEL=' .env | head -n1 | cut -d'=' -f2- | tr -d '"')" || true
    # if compose service keys equal the default names used in file, map accordingly
    if [ -n "$STACK_API_VAL" ] && [ -z "$API_SERVICE" ]; then
      # try to find service whose container_name default equals STACK_API_VAL or hms-api-like
      while IFS= read -r line; do
        if [[ $line =~ ^[[:space:]]{2}([a-zA-Z0-9._-]+): ]]; then
          svc="${BASH_REMATCH[1]}"
        fi
        if [[ "$line" == *container_name:* ]] && [[ "$line" == *STACK_API* ]] && [ -z "$API_SERVICE" ]; then
          API_SERVICE="$svc"
        fi
      done < "$COMPOSE_FILE"
    fi
  fi

  # Final defaults if still empty
  API_SERVICE="${API_SERVICE:-hms-api}"
  ADMIN_SERVICE="${ADMIN_SERVICE:-hms-admin-panel}"
  SYSTEM_SERVICE="${SYSTEM_SERVICE:-hms-system}"
  REDIS_SERVICE="${REDIS_SERVICE:-hms-redis}"
}

validate_target_services() {
  local service
  for service in "$API_SERVICE" "$ADMIN_SERVICE" "$SYSTEM_SERVICE"; do
    if [ "$service" = "$REDIS_SERVICE" ]; then
      echo "[maintenance] ERROR: Redis service '$REDIS_SERVICE' cannot be targeted by maintenance actions." >&2
      exit 7
    fi
  done
}

capture_redis_fingerprint() {
  local container_id
  container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "$REDIS_SERVICE" 2>/dev/null || true)"
  if [ -z "$container_id" ]; then
    echo "[maintenance] ERROR: Redis service '$REDIS_SERVICE' is not running or not found in compose." >&2
    exit 7
  fi

  local running
  running="$(docker inspect -f '{{.State.Running}}' "$container_id" 2>/dev/null || echo false)"
  if [ "$running" != "true" ]; then
    echo "[maintenance] ERROR: Redis service '$REDIS_SERVICE' is not running." >&2
    exit 7
  fi

  local started_at
  started_at="$(docker inspect -f '{{.State.StartedAt}}' "$container_id" 2>/dev/null || true)"
  if [ -z "$started_at" ]; then
    echo "[maintenance] ERROR: Could not read Redis startup metadata for '$REDIS_SERVICE'." >&2
    exit 7
  fi

  echo "$container_id|$started_at"
}

assert_redis_unchanged() {
  local before="$1"
  local after
  after="$(capture_redis_fingerprint)"

  if [ "$before" != "$after" ]; then
    local before_id
    local before_started
    local after_id
    local after_started
    before_id="${before%%|*}"
    before_started="${before#*|}"
    after_id="${after%%|*}"
    after_started="${after#*|}"

    echo "[maintenance] ERROR: Redis service '$REDIS_SERVICE' changed during maintenance." >&2
    echo "[maintenance] Before: id=$before_id started_at=$before_started" >&2
    echo "[maintenance] After:  id=$after_id started_at=$after_started" >&2
    exit 7
  fi
}

detect_services
validate_target_services


log "Detected services: SYSTEM='$SYSTEM_SERVICE' API='$API_SERVICE' ADMIN='$ADMIN_SERVICE' REDIS='$REDIS_SERVICE' (compose: $COMPOSE_FILE)"

log "Updating git repository (fetch + pull --ff-only)..."
# Auto-detect a known SSH key used on this host if GIT_SSH_KEY not provided
if [ -z "${GIT_SSH_KEY:-}" ] && [ -f "$HOME/.ssh/id_ed25519_sgserver_1774382506" ]; then
  GIT_SSH_KEY="$HOME/.ssh/id_ed25519_sgserver_1774382506"
  log "Auto-detected SSH key for git: $GIT_SSH_KEY"
fi

if [ "$SKIP_PULL" = "true" ]; then
  log "SKIP_PULL=true, skipping git fetch/pull"
else
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] git fetch --all --prune"
    echo "[DRY RUN] git pull --ff-only || (retry with GIT_SSH_KEY if provided)"
  else
    git fetch --all --prune
    if git pull --ff-only; then
      :
    else
      # If GIT_SSH_KEY is provided, retry using that key (use IdentitiesOnly)
      if [ -n "${GIT_SSH_KEY:-}" ] && [ -f "$GIT_SSH_KEY" ]; then
        log "git pull failed with --ff-only; retrying using SSH key: $GIT_SSH_KEY"
        GIT_SSH_COMMAND="ssh -i $GIT_SSH_KEY -o IdentitiesOnly=yes" git pull || {
          log "git pull retry with provided key also failed"
          git pull || true
        }
      else
        log "git pull failed with --ff-only, attempting default pull"
        git pull || true
      fi
    fi
  fi
fi

# Rebuild shared types after updating repository to ensure tests use
# the freshly generated types (some test failures are caused by
# outdated shared-types after a repo update).
if [ -d "app-shared-types" ]; then
  log "Rebuilding shared types after repository update"
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] npm run shared:build"
  else
    npm run shared:build
  fi
fi

if [ "$SKIP_TESTS" = "true" ]; then
  log "SKIP_TESTS=true, skipping test gate (npm run ci:tests)"
else
  log "Running test gate before stopping services: npm run ci:tests"
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] npm run ci:tests"
  else
    npm run ci:tests
  fi
fi

REDIS_FINGERPRINT_BEFORE=""
if [ "$DRY_RUN" = "true" ]; then
  log "DRY_RUN=true, skipping Redis runtime fingerprint checks"
else
  REDIS_FINGERPRINT_BEFORE="$(capture_redis_fingerprint)"
  log "Redis invariance guard enabled for service: $REDIS_SERVICE"
fi

wait_for_service_stopped() {
  local service="$1"
  local timeout_seconds="${2:-60}"
  local elapsed=0

  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    local container_id
    container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || true)"

    # If no container is attached to this service, it is effectively stopped.
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

  echo "[maintenance] ERROR: Service '$service' did not stop within ${timeout_seconds}s." >&2
  return 1
}

wait_for_service_healthy() {
  local service="$1"
  local timeout_seconds="${2:-180}"
  local elapsed=0

  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    local container_id
    container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || true)"

    if [ -n "$container_id" ]; then
      local running
      running="$(docker inspect -f '{{.State.Running}}' "$container_id" 2>/dev/null || echo false)"

      if [ "$running" = "true" ]; then
        local health
        health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || echo none)"

        if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
          return 0
        fi
      fi
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  echo "[maintenance] ERROR: Service '$service' did not become healthy within ${timeout_seconds}s." >&2
  return 1
}

cleanup_orphan_resources() {
  if [ "$CLEAN_ORPHANS" != "true" ]; then
    log "CLEAN_ORPHANS=$CLEAN_ORPHANS, skipping orphan cleanup"
    return 0
  fi

  log "Cleaning orphan Docker resources (containers, volumes, images)"
  run "docker container prune -f"
  run "docker volume prune -f"
  run "docker image prune -f"
}

log "Stopping services before build: $API_SERVICE, $ADMIN_SERVICE, $SYSTEM_SERVICE"
run "docker compose -f \"$COMPOSE_FILE\" stop \"$API_SERVICE\" \"$ADMIN_SERVICE\" \"$SYSTEM_SERVICE\""

if [ "$DRY_RUN" != "true" ]; then
  wait_for_service_stopped "$API_SERVICE" 60
  log "Confirmed API service is stopped: $API_SERVICE"
fi

build_parallel() {
  local services=("$@")
  local pids=()
  local svc
  for svc in "${services[@]}"; do
    if [ "$DRY_RUN" = "true" ]; then
      echo "[DRY RUN] docker compose -f \"$COMPOSE_FILE\" build \"$svc\" &"
    else
      log "Starting build for $svc"
      ( docker compose -f "$COMPOSE_FILE" build "$svc" ) &
      pids+=("$!")
    fi
  done

  # wait for builds to complete and capture failures
  local idx=0
  local failed=0
  if [ "$DRY_RUN" != "true" ]; then
    for pid in "${pids[@]}"; do
      wait "$pid" || failed=$((failed+1))
      idx=$((idx+1))
    done
  fi

  return $failed
}

log "Building services in parallel: $SYSTEM_SERVICE, $API_SERVICE, $ADMIN_SERVICE"
build_parallel "$SYSTEM_SERVICE" "$API_SERVICE" "$ADMIN_SERVICE"
build_status=$?
if [ $build_status -ne 0 ]; then
  echo "[maintenance] ERROR: One or more builds failed (status=$build_status)" >&2
  exit 3
fi

log "Starting rebuilt services in order (without dependencies): $SYSTEM_SERVICE -> $API_SERVICE -> $ADMIN_SERVICE"

run "docker compose -f \"$COMPOSE_FILE\" up -d --remove-orphans --no-deps \"$SYSTEM_SERVICE\""
if [ "$DRY_RUN" != "true" ]; then
  wait_for_service_healthy "$SYSTEM_SERVICE" 240
  log "Confirmed healthy service: $SYSTEM_SERVICE"
fi

run "docker compose -f \"$COMPOSE_FILE\" up -d --remove-orphans --no-deps \"$API_SERVICE\""
if [ "$DRY_RUN" != "true" ]; then
  wait_for_service_healthy "$API_SERVICE" 240
  log "Confirmed healthy service: $API_SERVICE"
fi

run "docker compose -f \"$COMPOSE_FILE\" up -d --remove-orphans --no-deps \"$ADMIN_SERVICE\""
if [ "$DRY_RUN" != "true" ]; then
  wait_for_service_healthy "$ADMIN_SERVICE" 180
  log "Confirmed healthy service: $ADMIN_SERVICE"
fi

if [ "$DRY_RUN" != "true" ]; then
  assert_redis_unchanged "$REDIS_FINGERPRINT_BEFORE"
  log "Redis invariance check passed: service remained untouched"
fi

cleanup_orphan_resources

log "Maintenance script completed successfully."

exit 0
