#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Single-node replica set bootstrap for MongoDB 4.4+ (works with 7.x).
# Uses mongosh when available; falls back to legacy mongo on 4.4 images.
# Idempotent: if the RS is already initiated, it exits successfully.
# -----------------------------------------------------------------------------

RS_NAME="${RS_NAME:-rs0}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MEMBER_HOST="${MEMBER_HOST:-hms-db-game:27017}"
WAIT_PING_RETRIES="${WAIT_PING_RETRIES:-60}"
WAIT_PRIMARY_RETRIES="${WAIT_PRIMARY_RETRIES:-60}"
SLEEP_SECS="${SLEEP_SECS:-2}"

log() { printf "%s | %s\n" "$(date +"%Y-%m-%d %H:%M:%S.%3N")" "$*"; }

# Detects the available shell: prefer mongosh, fallback to mongo.
detect_shell() {
  if command -v mongosh >/dev/null 2>&1; then
    echo "mongosh"
  elif command -v mongo >/dev/null 2>&1; then
    echo "mongo"
  else
    log "No Mongo shell found (mongosh nor mongo)."
    exit 1
  fi
}

MONGO_SHELL="$(detect_shell)"

# Runs a JavaScript expression and prints the raw result to stdout.
mongo_eval() {
  local js="$1"
  if [ "$MONGO_SHELL" = "mongosh" ]; then
    "$MONGO_SHELL" --quiet --host "$MONGO_HOST" --port "$MONGO_PORT" \
      --eval "$js"
  else
    "$MONGO_SHELL" --quiet --host "$MONGO_HOST" --port "$MONGO_PORT" \
      --eval "$js"
  fi
}

wait_for_mongod() {
  local tries="$WAIT_PING_RETRIES"
  log "Waiting for mongod on ${MONGO_HOST}:${MONGO_PORT}..."
  while ! mongo_eval 'db.adminCommand({ ping: 1 }).ok' | grep -q '^1$'; do
    tries=$((tries-1))
    if [ "$tries" -le 0 ]; then
      log "Timed out waiting for mongod."
      exit 1
    fi
    sleep "$SLEEP_SECS"
  done
  log "mongod is accepting connections."
}

rs_is_ok() {
  # Prints 1 when rs.status().ok == 1, otherwise 0.
  mongo_eval 'try { var s=rs.status(); s.ok ? 1 : 0 } catch(e) { 0 }' \
    | grep -q '^1$'
}

rs_has_primary() {
  # Prints 1 when a member is PRIMARY, otherwise 0.
  mongo_eval 'try { var s=rs.status(); 
    (s.ok===1 && s.members && s.members.some(m => m.stateStr==="PRIMARY")) ? 1 : 0
  } catch(e) { 0 }' | grep -q '^1$'
}

rs_initiate() {
  log "Initiating replica set '${RS_NAME}' with member '${MEMBER_HOST}'..."
  if [ "$MONGO_SHELL" = "mongosh" ]; then
    "$MONGO_SHELL" --quiet --host "$MONGO_HOST" --port "$MONGO_PORT" <<EOF
try {
  rs.initiate({
    _id: "${RS_NAME}",
    version: 1,
    members: [{ _id: 0, host: "${MEMBER_HOST}", priority: 1 }]
  });
} catch (e) { print(e); }
EOF
  else
    "$MONGO_SHELL" --quiet --host "$MONGO_HOST" --port "$MONGO_PORT" <<EOF
try {
  rs.initiate({
    _id: "${RS_NAME}",
    version: 1,
    members: [{ _id: 0, host: "${MEMBER_HOST}", priority: 1 }]
  });
} catch (e) { print(e); }
EOF
  fi
}

wait_for_primary() {
  local tries="$WAIT_PRIMARY_RETRIES"
  log "Waiting for PRIMARY state..."
  until rs_has_primary; do
    tries=$((tries-1))
    if [ "$tries" -le 0 ]; then
      log "Timed out waiting for PRIMARY."
      exit 1
    fi
    log "Still waiting for replica set PRIMARY..."
    sleep "$SLEEP_SECS"
  done
  log "Replica set '${RS_NAME}' is PRIMARY."
}

main() {
  wait_for_mongod

  if rs_is_ok; then
    log "Replica set already initialized."
  else
    rs_initiate
  fi

  wait_for_primary
  log "=> Replica set configured successfully (no-auth)."
}

main "$@"
