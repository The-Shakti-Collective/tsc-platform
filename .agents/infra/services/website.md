# tsc-web (Website) — Deployment Guide

**Host:** Vercel  
**Repo:** `The-Shakti-Collective/tsc-web` (public)  
**Domains:** `theshakticollective.in`, `www.theshakticollective.in`

## Status

**Greenfield** — not yet in monorepo. Scaffold during migration Step 6 per runbook.

## Stack

- Next.js (App Router), TypeScript, TailwindCSS
- SSG/ISR for marketing pages
- No API dependency required for launch stub

## Vercel setup

1. `pnpm create next-app@latest` in tsc-web repo
2. Import to Vercel
3. Copy `org-scaffold/tsc-infra/vercel/tsc-web.json` → repo `vercel.json`
3. Apex domain: Vercel DNS or Cloudflare CNAME flatten

## Environment variables

Minimal — see [environment-matrix.md](../environment-matrix.md):

- `NEXT_PUBLIC_POSTHOG_KEY` (optional analytics)
- `NEXT_PUBLIC_API_URL` (optional waitlist forms)

## Health check

Add `src/app/api/health/route.ts` (same pattern as tsc-community).

## DNS (Cloudflare)

| Type | Name | Target |
|------|------|--------|
| A/CNAME | `@` | Vercel apex |
| CNAME | `www` | `cname.vercel-dns.com` |

Redirect `www` → apex via Cloudflare Redirect Rule.

## Deploy

```powershell
.\org-scaffold\tsc-infra\scripts\deploy-vercel.ps1 -Project web -Environment production
```

## Legacy redirect

`theshakticollective.com` → `theshakticollective.in` (Cloudflare Redirect Rule)
