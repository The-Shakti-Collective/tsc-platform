# tsc-coreknot — Deployment Guide

**Host:** Vercel  
**Repo:** `The-Shakti-Collective/tsc-coreknot`  
**Domains:** `coreknot-staging.theshakticollective.in`, `coreknot.theshakticollective.in`

## Stack

- Legacy Vite React client (monorepo: `apps/coreknot/client/`)
- NestJS server may ship separately post-migration
- Clerk auth (when wired)

## Vercel setup

1. Import repo
2. If Vite SPA: set **Build Command** `pnpm build`, **Output** `dist`
3. Copy `org-scaffold/tsc-coreknot/vercel.json`
4. Add SPA fallback rewrite (included in vercel template)

## Environment variables

See [environment-matrix.md](../environment-matrix.md). Vite uses `VITE_*` prefix at build time.

## Health check

Static: `GET /health.json`

Vercel serverless (optional): `GET /api/health` via `org-scaffold/tsc-infra/vercel/api-health.js`

## Deploy

```powershell
.\org-scaffold\tsc-infra\scripts\deploy-vercel.ps1 -Project coreknot -Environment staging
```

## Monorepo (pre-migration)

```powershell
pnpm --filter @tsc/coreknot-client dev
# Port 3001
Invoke-RestMethod http://localhost:3001/health.json
```

## Note

Monorepo CoreKnot still uses stub API clients in places — fix before production cutover. See [known-gaps.md](../../../.specify/decisions/known-gaps.md) (Build Blockers).
