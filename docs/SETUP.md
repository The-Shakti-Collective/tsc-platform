# TSC Platform — Setup

> Local development setup. Architecture: [architecture/MASTER-PRODUCTION-ARCHITECTURE.md](./architecture/MASTER-PRODUCTION-ARCHITECTURE.md)

## Prerequisites

- Node.js 22+
- pnpm 9.15+
- Docker Desktop (optional — Postgres + Redis via `pnpm infra:up`)
- PowerShell (Windows) or bash (macOS/Linux)

## First-time setup

```powershell
git clone https://github.com/TheShaktiCollective/tsc-platform.git
cd tsc-platform
pnpm install
.\scripts\setup.ps1
```

`setup.ps1` copies all `.env.example` files to local secret files without overwriting existing.

Or manually:

```powershell
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\community\.env.example apps\community\.env.local
Copy-Item apps\website\.env.example apps\website\.env.local
Copy-Item apps\coreknot\server\.env.example apps\coreknot\server\.env
Copy-Item apps\coreknot\client\.env.example apps\coreknot\client\.env.local
pnpm db:generate
```

## Start stacks

| Command | Starts |
|---------|--------|
| `pnpm start:community` | Community (:3000) + Platform API (:4000) |
| `pnpm start:website` | Website (:3002) + Platform API |
| `pnpm start:coreknot` | CoreKnot client (:3001) + server (:5000) |
| `pnpm start:all` | All apps |
| `pnpm infra:up` | Docker Postgres + Redis only |

Skip Docker: append `:nodocker` variants or set `TSC_SKIP_DOCKER=true`.

## Auth modes (local)

**Stub (default):** `TSC_AUTH_STUB=true` in API; `NEXT_PUBLIC_AUTH_STUB=true` in frontends. No Clerk keys required.

**Clerk test keys:** Set real `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; disable stub flags.

See [architecture/AUTH-ARCHITECTURE.md](./architecture/AUTH-ARCHITECTURE.md).

## Database

```powershell
pnpm infra:up          # Docker Postgres :5432, Redis :6379
pnpm db:push           # Apply schema (dev)
pnpm db:migrate        # Create migration (dev)
pnpm db:studio         # Prisma Studio
```

CoreKnot Mongo (legacy): requires local Mongo or Atlas URI in `apps/coreknot/server/.env`. Target: Postgres-only — see [architecture/MONGO-SUNSET-REPORT.md](./architecture/MONGO-SUNSET-REPORT.md).

## Verify

```powershell
pnpm typecheck
pnpm sweep:local
```

Health endpoints:

- Platform API: http://localhost:4000/api/health/ready
- CoreKnot API: http://localhost:5000/api/health

## Env reference

| Template | Purpose |
|----------|---------|
| `.env.shared.example` | Shared infra keys |
| `.env.platform.example` | Platform API + frontends |
| `.env.coreknot.example` | CoreKnot server + client |
| [ENVIRONMENT_GUIDE.md](../ENVIRONMENT_GUIDE.md) | Full matrix |

## Repos (future splits)

| Logical repo | Current path |
|--------------|--------------|
| tsc-platform | This monorepo (api, website, community, packages) |
| tsc-coreknot | `apps/coreknot/` (extract pending) |

See [architecture/REPOSITORY-GOVERNANCE.md](./architecture/REPOSITORY-GOVERNANCE.md).

Tech debt elimination certificates: [elimination/README.md](./elimination/README.md).
