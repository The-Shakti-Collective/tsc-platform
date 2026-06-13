#!/usr/bin/env bash
# TSC Platform — start local dev stack (macOS / Linux)
# Usage: ./scripts/start.sh [--skip-infra] [--api-only] [--community-only]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_INFRA=0
API_ONLY=0
COMMUNITY_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --skip-infra) SKIP_INFRA=1 ;;
    --api-only) API_ONLY=1 ;;
    --community-only) COMMUNITY_ONLY=1 ;;
  esac
done

command -v pnpm >/dev/null 2>&1 || { echo "pnpm not found. Run ./scripts/setup.sh first." >&2; exit 1; }
[[ -f .env ]] || { echo ".env missing. Run ./scripts/setup.sh first." >&2; exit 1; }

cp .env apps/community/.env.local

if [[ "$SKIP_INFRA" -eq 0 ]] && command -v docker >/dev/null 2>&1; then
  echo "Starting Postgres + Redis..."
  docker compose up -d
fi

if [[ "$API_ONLY" -eq 1 ]]; then
  pnpm dev:api
elif [[ "$COMMUNITY_ONLY" -eq 1 ]]; then
  pnpm dev:community
else
  echo "Starting API + Community (Ctrl+C stops both)..."
  pnpm dev:api & API_PID=$!
  pnpm dev:community & COMMUNITY_PID=$!
  trap 'kill $API_PID $COMMUNITY_PID 2>/dev/null || true' INT TERM EXIT
  wait
fi
