# Agent Continuity Memory

> Last updated: 2026-06-13 — Backend Stabilization Sprint complete  
> Canonical detail: [MASTER-CONTEXT.md](../MASTER-CONTEXT.md) · [.specify/MASTER.md](../.specify/MASTER.md)

## Sprint outcome

**Phase R0 backend stabilization: CODE COMPLETE.** `@tsc/api` typecheck 0, build green, health + Swagger + auth + observability scaffolds shipped. Production deploy blocked on founder secrets/DNS only.

## Quick reference

```
Health:     GET /api/health | /api/health/live | /api/health/ready
Swagger:    GET /api/docs  |  pnpm openapi:export
Auth:       ClerkAuthGuard + dev stub (disabled in production)
Obs:        apps/api/src/observability/ (Sentry, PostHog, BetterStack scaffold)
Queues:     tsc.feed | tsc.reputation | tsc.graph | tsc.recommendation
Railway:    apps/api/railway.toml  healthcheck /api/health/ready
CI:         .github/workflows/{lint,typecheck,test,build,security}.yml
```

## Checklist score (code vs prod)

| Status | Items |
|--------|-------|
| GREEN (code) | Typecheck, build, health trio, feed health, auth stub, database barrel, contracts, Prisma validate, Swagger `/api/docs`, observability scaffold |
| AMBER | Clerk JWT (needs real keys), Redis/BullMQ (needs `REDIS_URL` in prod) |
| RED (founder) | Typesense index, R2 upload, production DNS/deploy |

## Do not redo

- Global health module, Swagger mount, ClerkAuthGuard unification, Sentry/PostHog wiring — already merged.
- Re-fixing typecheck from scratch — board at 0 errors; see `API_TYPECHECK_BOARD.md`.

## Gate for domain work

No Community/CoreKnot/Marketplace feature sprints until founder completes `FOUNDER-TASKS.md` (Clerk, Railway, Cloudflare, optional Redis/Sentry).
