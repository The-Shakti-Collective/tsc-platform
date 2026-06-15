# Deployment Architecture

> **Target stack:** Vercel (frontends) + Railway (APIs/workers) + Neon + Cloudflare  
> **Not target:** Render (legacy config present — remove after Railway cutover)

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare DNS                                               │
│  theshakticollective.in → Vercel                            │
│  api.theshakticollective.in → Railway                       │
│  coreknot.in → Vercel                                       │
│  api.coreknot.in → Railway                                  │
└─────────────────────────────────────────────────────────────┘
```

## TSC Platform

### TSC Website

| Setting | Value |
|---------|-------|
| Host | Vercel |
| Root | `apps/website` |
| Config | `apps/website/vercel.json` |
| Framework | Next.js |
| Region | `bom1` |
| Domain | `theshakticollective.in`, `www.theshakticollective.in` |

### TSC Community

| Setting | Value |
|---------|-------|
| Host | Vercel |
| Root | `apps/community` |
| Config | `apps/community/vercel.json` |
| Framework | Next.js |
| Region | `bom1` |
| Domain | `theshakticollective.in/community` (path) or subdomain per DNS decision |

### Platform API

| Setting | Value |
|---------|-------|
| Host | **Railway** |
| Monorepo root | Repository root (not `apps/api`) |
| Config | `/railway.json`, `/nixpacks.toml`, `apps/api/railway.toml` (reference) |
| Start | `node scripts/railway-start.mjs` |
| Health | `GET /api/health/live` |
| Domain | `api.theshakticollective.in` |
| Bind | `0.0.0.0:$PORT` |

Build command (from `railway.toml`):

```
pnpm install --frozen-lockfile && pnpm db:generate && pnpm build && pnpm verify:dist && RAILWAY_DEPLOY_DIR=/app/deploy node scripts/create-deploy-bundle.mjs
```

## CoreKnot

### CoreKnot Client

| Setting | Value |
|---------|-------|
| Host | Vercel |
| Root | `apps/coreknot/client` |
| Config | `apps/coreknot/client/vercel.json`, `apps/coreknot/vercel.json` |
| Framework | Vite |
| Domain | `coreknot.in` |

### CoreKnot API + Workers

| Setting | Value |
|---------|-------|
| Host | **Railway** (two services) |
| Root directory | `apps/coreknot/server` |
| Config | `apps/coreknot/server/railway.toml` |
| API start | `node server.js` (`RUN_WORKERS=false`) |
| Worker start | `node workers/startWorkers.js` (`RUN_WORKERS=true`) |
| Health | `GET /api/health` |
| Domain | `api.coreknot.in` |

**Legacy — ARCHIVED:** Render blueprint at `docs/archive/render.coreknot.legacy.yaml`. Do not deploy to Render for new environments.

## Shared infrastructure

| Service | Provider | Used by |
|---------|----------|---------|
| PostgreSQL | Neon | Platform API, CoreKnot (Postgres path) |
| Redis | Upstash or Railway KV | BullMQ queues both APIs |
| Object storage | Cloudflare R2 | Media, finance attachments (target) |
| Search | Typesense Cloud | Platform search (P2) |
| Identity | Clerk | All frontends + Platform API |
| Analytics | PostHog | All apps |
| Errors | Sentry | All apps |
| Email | Resend | CoreKnot mail, Platform notifications |
| DNS / CDN | Cloudflare | All domains |

## Environment separation

| Environment | Neon | Clerk | Domains |
|-------------|------|-------|---------|
| Local | Docker Postgres or Neon dev branch | Test keys or stub | localhost ports |
| Staging | Neon branch | Test app | `*.vercel.app`, staging Railway |
| Production | Neon main | Prod app | Production domains above |

## Deploy flow (target)

1. Push to `main` → GitHub Actions CI (lint, typecheck, test, build)
2. Railway auto-deploy Platform API + CoreKnot (on success)
3. Vercel auto-deploy frontends (monorepo path filters)
4. Post-deploy: `pnpm sweep:prod` or BetterStack heartbeats

## Config file audit

| File | Status | Action |
|------|--------|--------|
| `/railway.json` | Active — Platform API | Keep |
| `apps/api/railway.toml` | Reference doc | Keep |
| `apps/coreknot/server/railway.toml` | Active — CoreKnot | Keep |
| `docs/archive/render.coreknot.legacy.yaml` | Legacy | Rollback reference only |
| `apps/*/vercel.json` | Active | Keep |
| `org-scaffold/tsc-infra/railway/*.json` | Templates | Move to `tsc-infra` repo |

## Founder blockers (deploy)

Per `.agents/MEMORY.md` and FOUNDER-TASKS:

- Railway services not live (0/8 founder steps complete)
- DNS NXDOMAIN for production domains
- Secrets not set in Railway/Vercel dashboards

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for step-by-step cutover.

## Rollback

- **Railway:** Redeploy previous deployment in dashboard; `org-scaffold/tsc-infra/docs/rollback-strategy.md`
- **Vercel:** Instant rollback to prior deployment
- **Database:** Neon point-in-time restore (founder action)
- **CoreKnot Mongo parallel-run:** Keep `MONGODB_URI_PROD` during 30-day window — see [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md)
