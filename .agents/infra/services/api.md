# tsc-api — Deployment Guide

**Host:** Railway  
**Repo:** `The-Shakti-Collective/tsc-api`  
**Domains:** `api-staging.theshakticollective.in` (develop), `api.theshakticollective.in` (main)

## Prerequisites

- Neon Postgres (staging + prod branches)
- Upstash Redis (staging + prod)
- Clerk, Typesense, R2, Sentry, PostHog accounts
- `RAILWAY_TOKEN` in GitHub org secrets

## Railway setup

1. Create project **TSC Platform**
2. Add services from GitHub repo `tsc-api`:
   - `tsc-api-staging` → branch `develop`
   - `tsc-api-prod` → branch `main`
3. Copy config from `org-scaffold/tsc-api/railway.json`
4. Set env vars from [environment-matrix.md](../environment-matrix.md)
5. Custom domain → CNAME to Railway (Cloudflare DNS only, not proxied)

## Build & start

| Phase | Command |
|-------|---------|
| Build | `pnpm install && pnpm db:generate && pnpm build` |
| Start | `node dist/main.js` |
| Migrations | `pnpm prisma migrate deploy` (run once per deploy or in release job) |

## Health checks

- Liveness: `GET /health`
- Readiness (Railway): `GET /health/ready`

## Deploy flow

```
PR → develop → CI green → Railway staging auto-deploy → smoke /health/ready
Release PR develop → main → Railway prod → smoke → DNS already points
```

## Scripts

```powershell
# Deploy via Railway CLI (linked project)
railway up --service tsc-api-staging

# Health smoke
.\org-scaffold\tsc-infra\scripts\health-check.ps1 -Environment staging
```

## Monorepo (pre-migration)

```powershell
pnpm dev:api
# or
.\scripts\run-api-dev.ps1
```

Local health: `http://localhost:4000/health/ready`
