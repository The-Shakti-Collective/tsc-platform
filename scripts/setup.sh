#!/usr/bin/env bash
# TSC Platform — first-time setup (macOS / Linux)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

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

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit Clerk keys before using auth."
else
  echo ".env already exists — skipping."
fi

cp .env apps/community/.env.local
echo "Synced .env -> apps/community/.env.local"

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
