# NestJS Runtime Startup Audit

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** NestJS Runtime

## Entry point — `apps/api/src/main.ts`

| Check | Status |
|-------|--------|
| `PORT` from env | `Number(process.env.PORT ?? 4000)` — OK |
| Bind address | `0.0.0.0` — OK (Railway/Render compatible) |
| Global prefix | `resolveApiGlobalPrefix()` → `/api` — OK |
| CORS | `CORS_ORIGIN` env — OK |
| Sentry | Optional via `SENTRY_DSN` — OK |
| Swagger | `/api/docs` — OK |

## Start command

```json
"start:prod": "node dist/main.js"
```

Railway: `pnpm --filter @tsc/api start:prod` — runs from `apps/api` package context. Correct.

## Health endpoints

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Summary |
| `GET /api/health/live` | Liveness (no deps) |
| `GET /api/health/ready` | Prisma `SELECT 1` + Redis PING |

`railway.json` / `railway.toml` healthcheck: `/api/health/ready` — OK.

## DatabaseModule / Prisma

- `PrismaService` imports `PrismaClient` from `@tsc/database/client`
- Requires `packages/database/dist/client.js` at runtime
- `onModuleInit` → `$connect()` — fails readiness if `DATABASE_URL` bad (expected)

## Redis

- BullMQ via `QueueRegistryService`
- Readiness checks Redis PING when `REDIS_URL` set

## Module resolution blocker (fixed separately)

Startup never reached health checks because `require("@tsc/database")` threw before Nest bootstrap completed. Fixed by building workspace `dist/` before deploy.

## ESM / CJS note

API compiles to CommonJS. Workspace packages use `"type": "module"`. Node 20 resolves via `exports` map; `require("@tsc/database")` works when `dist/index.js` exists (verified locally).

## Status

Runtime bootstrap config production-ready. Module resolution was the crash cause, not PORT/bind/health wiring.
