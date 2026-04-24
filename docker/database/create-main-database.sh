#!/usr/bin/env bash
set -euo pipefail
set -x

echo "--- Starting create-main-database.sh script ---"

# ─────────────────────────────────────────────────────────────────────────────
# Inputs from environment (.env → docker-compose 'environment')
# ─────────────────────────────────────────────────────────────────────────────
ADMIN_PASSWORD="${DB_MAIN_ADMIN_PASSWORD:-${POSTGRES_PASSWORD:-}}"

APP_USER="${DB_MAIN_USERNAME:-}"
APP_PASSWORD="${DB_MAIN_PASSWORD:-}"
APP_DATABASE="${POSTGRES_DB:-}"

# ─────────────────────────────────────────────────────────────────────────────
# Validations
# ─────────────────────────────────────────────────────────────────────────────
if [ -z "${ADMIN_PASSWORD}" ]; then
  echo "ERROR: ADMIN_PASSWORD not set (DB_MAIN_ADMIN_PASSWORD/POSTGRES_PASSWORD)."
  exit 1
fi

if [ -z "${APP_USER}" ]; then
  echo "ERROR: DB_MAIN_USERNAME not set."
  exit 1
fi

if [ -z "${APP_PASSWORD}" ]; then
  echo "ERROR: DB_MAIN_PASSWORD not set."
  exit 1
fi

if [ -z "${APP_DATABASE}" ]; then
  echo "ERROR: POSTGRES_DB (APP_DATABASE) not set."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Wait for PostgreSQL socket to be ready
# ─────────────────────────────────────────────────────────────────────────────
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -U postgres; do
  sleep 2
done

echo "Creating database and users..."

# Helper to check command exit codes
check_error() {
  if [ $? -ne 0 ]; then
    echo "ERROR: $1 failed"
    exit 1
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# 1) Create/Update admin role (hms_admin) as SUPERUSER
# ─────────────────────────────────────────────────────────────────────────────
psql -v ON_ERROR_STOP=1 -U postgres <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hms_admin') THEN
      CREATE ROLE hms_admin WITH LOGIN PASSWORD '${ADMIN_PASSWORD}' SUPERUSER;
      RAISE NOTICE 'User hms_admin created.';
    ELSE
      ALTER ROLE hms_admin WITH PASSWORD '${ADMIN_PASSWORD}' SUPERUSER;
      RAISE NOTICE 'User hms_admin updated.';
    END IF;
  END
  \$\$;
EOSQL
check_error "Create/Update admin user (hms_admin)"

# ─────────────────────────────────────────────────────────────────────────────
# 2) Create/Update application user (APP_USER)
# ─────────────────────────────────────────────────────────────────────────────
psql -v ON_ERROR_STOP=1 -U postgres <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_USER}') THEN
      EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L;', '${APP_USER}',
                     '${APP_PASSWORD}');
      RAISE NOTICE 'User % created.', '${APP_USER}';
    ELSE
      EXECUTE format('ALTER ROLE %I WITH PASSWORD %L;', '${APP_USER}',
                     '${APP_PASSWORD}');
      RAISE NOTICE 'User % updated.', '${APP_USER}';
    END IF;
  END
  \$\$;
EOSQL
check_error "Create/Update application user"

# ─────────────────────────────────────────────────────────────────────────────
# 3) Create database (owner = APP_USER) if not exists
# ─────────────────────────────────────────────────────────────────────────────
psql -v ON_ERROR_STOP=1 -U postgres <<-EOSQL
  SELECT
    'CREATE DATABASE "' || replace('${APP_DATABASE}', '"', '""') ||
    '" WITH OWNER "' || replace('${APP_USER}', '"', '""') ||
    '" ENCODING ''UTF8'' LC_COLLATE ''en_US.utf8'' LC_CTYPE ''en_US.utf8'' ' ||
    'TEMPLATE template0'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_database WHERE datname = '${APP_DATABASE}'
  )
\gexec
EOSQL
check_error "Create database"

# ─────────────────────────────────────────────────────────────────────────────
# 4) Inside the app database: extension + grants + default privileges
# ─────────────────────────────────────────────────────────────────────────────
psql -v ON_ERROR_STOP=1 -U postgres -d "${APP_DATABASE}" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  GRANT USAGE ON SCHEMA public TO "${APP_USER}";
  GRANT CREATE ON SCHEMA public TO "${APP_USER}";

  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${APP_USER}";
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${APP_USER}";
  GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "${APP_USER}";

  ALTER DEFAULT PRIVILEGES FOR ROLE "${APP_USER}"
    IN SCHEMA public GRANT ALL ON TABLES TO "${APP_USER}";
  ALTER DEFAULT PRIVILEGES FOR ROLE "${APP_USER}"
    IN SCHEMA public GRANT ALL ON SEQUENCES TO "${APP_USER}";
  ALTER DEFAULT PRIVILEGES FOR ROLE "${APP_USER}"
    IN SCHEMA public GRANT ALL ON FUNCTIONS TO "${APP_USER}";
EOSQL
check_error "Schema grants and extension"

# ─────────────────────────────────────────────────────────────────────────────
# 5) Hardening basics + postgres password alignment
# ─────────────────────────────────────────────────────────────────────────────
psql -v ON_ERROR_STOP=1 -U postgres <<-EOSQL
  REVOKE ALL ON DATABASE postgres  FROM PUBLIC;
  REVOKE ALL ON DATABASE template0 FROM PUBLIC;
  REVOKE ALL ON DATABASE template1 FROM PUBLIC;

  ALTER USER postgres WITH PASSWORD '${ADMIN_PASSWORD}';
  -- You may also enable SCRAM:
  -- ALTER SYSTEM SET password_encryption = 'scram-sha-256';
  -- SELECT pg_reload_conf();
EOSQL
check_error "Security hardening and postgres password update"

# ─────────────────────────────────────────────────────────────────────────────
# 6) Connection tests
# ─────────────────────────────────────────────────────────────────────────────
echo "Verifying admin user access..."
PGPASSWORD="${ADMIN_PASSWORD}" \
  psql -U hms_admin -d postgres -c "SELECT 1 AS admin_connection_test;"
check_error "Admin user connection test"

echo "Verifying application user access..."
PGPASSWORD="${APP_PASSWORD}" \
  psql -U "${APP_USER}" -d "${APP_DATABASE}" \
  -c "SELECT 1 AS app_connection_test;"
check_error "Application user connection test"

echo "Database initialization completed successfully!"
