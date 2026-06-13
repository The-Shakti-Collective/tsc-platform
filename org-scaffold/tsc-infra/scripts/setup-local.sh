#!/usr/bin/env bash
# Bootstrap local dev dependencies (Postgres, Redis)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../local/docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing $COMPOSE_FILE — copy from monorepo root docker-compose.yml"
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d
echo "Local infra up. Postgres :5432, Redis :6379"
