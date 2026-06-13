#!/usr/bin/env bash
# TSC Platform — one command: Docker infra + API + frontend (macOS / Linux)
# Usage: ./scripts/start-stack.sh community|coreknot|website|all [--skip-infra]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET="${1:-}"
SKIP_INFRA=0

for arg in "$@"; do
  case "$arg" in
    --skip-infra) SKIP_INFRA=1 ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Usage: ./scripts/start-stack.sh community|coreknot|website|all [--skip-infra]" >&2
  exit 1
fi

case "$TARGET" in
  community|coreknot|website|all) ;;
  *)
    echo "Invalid target: $TARGET" >&2
    exit 1
    ;;
esac

command -v pnpm >/dev/null 2>&1 || { echo "pnpm not found. Run ./scripts/setup.sh first." >&2; exit 1; }
[[ -f .env ]] || { echo ".env missing. Run ./scripts/setup.sh first." >&2; exit 1; }

cp .env apps/community/.env.local

if [[ "$SKIP_INFRA" -eq 0 ]]; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    SERVICES=()
    if ! grep -qE 'neon\.tech' .env 2>/dev/null; then SERVICES+=("postgres"); fi
    REDIS_URL="$(grep -E '^\s*REDIS_URL\s*=' .env | head -1 | cut -d= -f2- | tr -d "\"'" || true)"
    if [[ -z "$REDIS_URL" || "$REDIS_URL" =~ localhost|127\.0\.0\.1 ]]; then
      SERVICES+=("redis")
    fi
    if [[ ${#SERVICES[@]} -gt 0 ]]; then
      echo "Starting Docker infra: ${SERVICES[*]}"
      docker compose up -d "${SERVICES[@]}"
    else
      echo "Skipping Docker infra — remote DATABASE_URL / REDIS_URL in .env"
    fi
  else
    echo "Docker not running — start Docker or use --skip-infra" >&2
    exit 1
  fi
fi

declare -A LABEL URL CORS DEV
LABEL[community]=Community; URL[community]=http://localhost:3000; CORS[community]=http://localhost:3000; DEV[community]=dev:community
LABEL[coreknot]=CoreKnot;   URL[coreknot]=http://localhost:3001;  CORS[coreknot]=http://localhost:3001;  DEV[coreknot]=dev:coreknot
LABEL[website]=Website;     URL[website]=http://localhost:3002;    CORS[website]=http://localhost:3002;    DEV[website]=dev:website

if [[ "$TARGET" == "all" ]]; then
  CORS_ALL="${CORS[community]},${CORS[coreknot]},${CORS[website]}"
  echo "Starting ALL stacks..."
  CORS_ORIGIN="$CORS_ALL" pnpm dev:api &
  sleep 2
  pnpm dev:community &
  pnpm dev:coreknot &
  pnpm dev:website &
  wait
else
  echo "Starting ${LABEL[$TARGET]} stack..."
  echo "  API:      http://localhost:4000/api"
  echo "  Frontend: ${URL[$TARGET]}"
  CORS_ORIGIN="${CORS[$TARGET]}" pnpm dev:api &
  sleep 2
  pnpm "${DEV[$TARGET]}" &
  wait
fi
