# Deployment Certificate (Agent 11)

> **Date:** 2026-06-15  
> **Architecture:** [../architecture/DEPLOYMENT-ARCHITECTURE.md](../architecture/DEPLOYMENT-ARCHITECTURE.md)

## Before state

| Platform | Config | Status |
|----------|--------|--------|
| Railway — Platform API | `/railway.json`, `/nixpacks.toml`, `apps/api/railway.toml` | ✅ Canonical |
| Railway — CoreKnot | `apps/coreknot/server/railway.toml` | ✅ Documented |
| Vercel — Website | `apps/website/vercel.json` | ✅ `bom1`, monorepo install |
| Vercel — Community | `apps/community/vercel.json` | ✅ |
| Vercel — CoreKnot | `apps/coreknot/client/vercel.json` | ⚠️ H5 install path (founder) |
| Render | `apps/coreknot/render.yaml` | ❌ Legacy — deploy ambiguity |
| Neon | Shared Postgres | Documented in env templates |
| Redis | BullMQ / queues | Required prod for workers |
| Cloudflare | `org-scaffold/tsc-infra/cloudflare/dns-records.md` | Template only |

## After state

| Action | Result |
|--------|--------|
| `apps/coreknot/render.yaml` | **Removed** — archived to `docs/archive/render.coreknot.legacy.yaml` |
| `docs/DEPLOYMENT.md` | Points to Railway-only for CoreKnot |
| Health checks | Platform: `/api/health/live` (liveness), `/api/health/ready` (readiness) |
| Bind | `0.0.0.0:$PORT` via Railway start scripts |

## Deploy authority (certified)

```
Production stack:
  Frontends  → Vercel (Website, Community, CoreKnot client)
  APIs       → Railway (Platform API, CoreKnot API)
  Workers    → Railway (CoreKnot workers service)
  Database   → Neon PostgreSQL
  Cache      → Redis (Railway or Upstash)
  DNS/TLS    → Cloudflare
  Object     → Cloudflare R2 (scaffold)
  NOT TARGET → Render
```

## Environment templates

| File | Scope |
|------|-------|
| `.env.shared.example` | Cross-product infra |
| `.env.platform.example` | Platform API + frontends |
| `.env.coreknot.example` | CoreKnot server + client |
| Per-app `.env.example` | Local overrides |

## Pre-production blockers (unchanged)

- Founder FOUNDER-TASKS Steps 1–5 not complete
- CoreKnot Mongo cutover in progress
- DNS records partially NXDOMAIN per infra audit

## Risk

| Risk | Mitigation |
|------|------------|
| Team still using Render blueprint | Archive retained with LEGACY header |
| Railway root directory mis-set to `apps/api` | Documented in `railway.toml` comments + DEPLOYMENT.md |

## Rollback

- Restore `apps/coreknot/render.yaml` from `docs/archive/render.coreknot.legacy.yaml`
- Re-link Render services if still in use (not recommended)
