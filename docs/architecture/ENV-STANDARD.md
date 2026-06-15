# Environment Standard

> Normalized env templates at repo root. Per-app templates remain for local overrides.  
> Full matrix: [ENV-STANDARD.md](./ENV-STANDARD.md) + [../../ENVIRONMENT_GUIDE.md](../../ENVIRONMENT_GUIDE.md)

## Canonical template files

| File | Scope | Copy to |
|------|-------|---------|
| [`.env.shared.example`](../../.env.shared.example) | Neon, Redis, observability keys | Reference only — copy vars into app envs |
| [`.env.platform.example`](../../.env.platform.example) | Platform API + frontends | Split per app below |
| [`.env.coreknot.example`](../../.env.coreknot.example) | CoreKnot server + client | Split per app below |
| `.env.example` (root) | Local Docker infra | `.env` |
| `apps/api/.env.example` | Platform API | `apps/api/.env` |
| `apps/community/.env.example` | Community | `apps/community/.env.local` |
| `apps/website/.env.example` | Website | `apps/website/.env.local` |
| `apps/coreknot/server/.env.example` | CoreKnot API | `apps/coreknot/server/.env` |
| `apps/coreknot/client/.env.example` | CoreKnot client | `apps/coreknot/client/.env.local` |
| `packages/database/.env.example` | Prisma CLI | `packages/database/.env` (optional) |

## Prefix rules

| Prefix | Exposure | Apps |
|--------|----------|------|
| _(none)_ | Server only | API, CoreKnot server |
| `NEXT_PUBLIC_*` | Browser | Community, Website |
| `VITE_*` | Build-time browser | CoreKnot client |

**Never** put secrets in `NEXT_PUBLIC_*` or `VITE_*`.

## Shared variables (all backends)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Prod yes | Neon PostgreSQL connection string |
| `REDIS_URL` | Prod yes (workers) | Redis/Valkey for BullMQ |
| `NODE_ENV` | Yes | `development` \| `production` \| `test` |
| `SENTRY_DSN` | Prod recommended | Error tracking |
| `POSTHOG_PROJECT_TOKEN` | Optional | Server-side analytics |

## Platform-specific

| Variable | App | Required prod |
|----------|-----|---------------|
| `CLERK_SECRET_KEY` | Platform API | Yes |
| `CLERK_WEBHOOK_SECRET` | Platform API | Yes (when webhooks live) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Community, Website | Yes |
| `NEXT_PUBLIC_API_URL` | Community | Yes |
| `NEXT_PUBLIC_TSC_API_URL` | Website | Yes |
| `TSC_AUTH_STUB` | Platform API | **No** — dev only |
| `CORS_ORIGIN` | Platform API | Yes |
| `TSC_PUBLIC_URL` | Platform API | Yes |

## CoreKnot-specific

| Variable | Required prod | Sunset |
|----------|---------------|--------|
| `JWT_SECRET` | Yes (today) | Replace with Clerk |
| `MONGODB_URI_PROD` | Yes (today) | Remove after Mongo sunset |
| `COREKNOT_POSTGRES_ENABLED` | Yes (target) | — |
| `COREKNOT_*_STORE` | Per domain | — |
| `RUN_WORKERS` | Worker service | — |
| `VITE_API_URL` | Client build | Yes |

## Load order (local dev)

| App | Order |
|-----|-------|
| Platform API | `apps/api/.env` → root `.env` (via `run-api-dev.ps1`) |
| CoreKnot server | `apps/coreknot/server/.env` → root `.env` |
| Next.js apps | `apps/<app>/.env.local` only |
| Prisma CLI | `packages/database/.env` or root `DATABASE_URL` |

## Production placement

| Provider | Variables |
|----------|-----------|
| Railway (Platform API) | `DATABASE_URL`, `REDIS_URL`, `CLERK_*`, `CORS_ORIGIN`, `SENTRY_DSN`, R2, Typesense |
| Railway (CoreKnot) | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `MONGODB_URI_PROD` (until sunset), `COREKNOT_*`, webhooks |
| Vercel (each frontend) | `NEXT_PUBLIC_*` or `VITE_*`, Clerk publishable key — see `apps/community/.env.vercel.example` |
| Never in git | All secrets above |

## Anti-patterns (remove)

| Pattern | Why |
|---------|-----|
| Duplicating `DATABASE_URL` inconsistently across files | Connection drift |
| `MAIL_USE_PROD_DB=true` on dev laptops | Writes to production Mongo |
| Placeholder Clerk keys in production | Accidental stub auth |
| `ALLOW_PROD_DB_IN_DEV=true` without IP allowlist | Data risk |
| Mongo + Postgres both authoritative without store flags | Dual-write corruption |

## Setup command

```powershell
.\scripts\setup.ps1   # copies all .env.example → local secret files
```

See [../SETUP.md](../SETUP.md).
