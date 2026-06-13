# tsc-community — Deployment Guide

**Host:** Vercel  
**Repo:** `The-Shakti-Collective/tsc-community`  
**Domains:** `community-staging.theshakticollective.in`, `community.theshakticollective.in`

## Stack

- Next.js 15 (App Router)
- Clerk auth
- TanStack Query → tsc-api

## Vercel setup

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Framework: **Next.js**
3. Root directory: `/` (after monorepo extract: repo root)
4. Copy `org-scaffold/tsc-community/vercel.json`
5. Region: `bom1` (Mumbai)

## Environment variables

Set in Vercel **Production** and **Preview** (staging) from [environment-matrix.md](../environment-matrix.md).

Critical:

- `NEXT_PUBLIC_API_URL` → must include `/api` suffix
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (matching Clerk instance)

## Branch mapping

| Branch | Vercel | Domain |
|--------|--------|--------|
| `develop` | Preview / staging alias | `community-staging.theshakticollective.in` |
| `main` | Production | `community.theshakticollective.in` |

## Health check

`GET /api/health` → `{ status: "ok", service: "tsc-community" }`

## Deploy

```powershell
.\org-scaffold\tsc-infra\scripts\deploy-vercel.ps1 -Project community -Environment staging
```

## Monorepo (pre-migration)

```powershell
pnpm dev:community
# Port 3000
Invoke-RestMethod http://localhost:3000/api/health
```

## Clerk

Add Vercel preview URLs + staging/prod domains to Clerk **Allowed origins**.
