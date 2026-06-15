#!/usr/bin/env bash
# TSC Platform — first-time setup (macOS / Linux)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ensure_env_from_example() {
  local example="$1"
  local target="$2"
  local label="${3:-$target}"
  if [[ -f "$target" ]]; then
    echo "$label already exists — skipping."
    return 0
  fi
  if [[ ! -f "$example" ]]; then
    echo "Warning: missing example $example (skipped $label)" >&2
    return 0
  fi
  mkdir -p "$(dirname "$target")"
  cp "$example" "$target"
  echo "Created $label from example."
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: $1 not found. $2" >&2
    exit 1
  fi
}

echo "TSC Platform setup"
echo "Root: $ROOT"
echo

require_cmd node "Install Node.js 20+ from https://nodejs.org/"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Enabling pnpm via corepack..."
  corepack enable
  corepack prepare pnpm@9.15.0 --activate
fi

require_cmd pnpm "Run: corepack enable && corepack prepare pnpm@9.15.0 --activate"

echo "Creating env files from per-app .env.example (existing files are never overwritten)..."
echo

ensure_env_from_example "$ROOT/.env.example" "$ROOT/.env" "root .env"
ensure_env_from_example "$ROOT/apps/api/.env.example" "$ROOT/apps/api/.env" "apps/api/.env"
ensure_env_from_example "$ROOT/apps/community/.env.example" "$ROOT/apps/community/.env.local" "apps/community/.env.local"
ensure_env_from_example "$ROOT/apps/website/.env.example" "$ROOT/apps/website/.env.local" "apps/website/.env.local"
ensure_env_from_example "$ROOT/apps/coreknot/client/.env.example" "$ROOT/apps/coreknot/client/.env.local" "apps/coreknot/client/.env.local"
ensure_env_from_example "$ROOT/apps/coreknot/server/.env.example" "$ROOT/apps/coreknot/server/.env" "apps/coreknot/server/.env"

if [[ -f "$ROOT/.env" && ! -f "$ROOT/packages/database/.env" ]]; then
  db_url="$(grep -E '^\s*DATABASE_URL\s*=' "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d "\"'" || true)"
  if [[ -n "$db_url" ]]; then
    if [[ -f "$ROOT/packages/database/.env.example" ]]; then
      cp "$ROOT/packages/database/.env.example" "$ROOT/packages/database/.env"
    else
      echo "DATABASE_URL=$db_url" > "$ROOT/packages/database/.env"
    fi
    echo "Created packages/database/.env from root DATABASE_URL."
  fi
fi

echo
echo "See ENVIRONMENT_GUIDE.md for load order and Clerk/auth setup."

echo
echo "Installing dependencies..."
pnpm install

if command -v docker >/dev/null 2>&1; then
  echo
  echo "Starting Postgres + Redis..."
  docker compose up -d
  echo "Waiting for Postgres..."
  for _ in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U postgres -d tsc_community >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
else
  echo "Warning: Docker not found. Start Postgres + Redis manually (see .specify/infrastructure/local-dev.md)."
fi

echo
echo "Generating Prisma client..."
pnpm db:generate

echo
echo "Pushing schema to database..."
pnpm db:push

echo
echo "Building shared packages..."
pnpm build

echo
echo "Setup complete."
echo "Next: pnpm start"
echo "Community: http://localhost:3000"
echo "API:       http://localhost:4000/api"
echo "CoreKnot:  http://localhost:3001  (CRM API :5000)"
