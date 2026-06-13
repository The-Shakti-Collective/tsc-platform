# TSC Platform — Founder Setup Runbook

**Audience:** Founder only (secrets, DNS, provider dashboards)  
**Repo:** `c:\Projects\TSC Platform`  
**Date:** 2026-06-14  
**Engineering status:** see [SETUP-ENGINEERING-STATUS.md](./SETUP-ENGINEERING-STATUS.md)

Complete steps **in order**. Placeholders shown as `<LIKE_THIS>` — replace with real values from each provider dashboard.

---

## Prerequisites on your machine

1. Install **Node.js 22** (matches `.nvmrc`):
   ```powershell
   nvm install 22
   nvm use 22
   node --version
   ```
   Expected: `v22.x.x`

2. Enable **pnpm 9.15.0**:
   ```powershell
   corepack enable
   corepack prepare pnpm@9.15.0 --activate
   pnpm --version
   ```
   Expected: `9.15.0`

3. Install **Git** and authenticate **GitHub CLI** (outside repo):
   ```powershell
   gh auth login
   gh auth status
   ```

4. Install **Railway CLI** (outside repo):
   ```powershell
   npm install -g @railway/cli
   railway login
   ```

5. Install **Vercel CLI** (outside repo):
   ```powershell
   npm install -g vercel
   vercel login
   ```

---

## Step 1 — Push monorepo to GitHub

1. Create org/repo if missing: `https://github.com/TheShaktiCollective/tsc-platform` (or your canonical name).
2. From repo root:
   ```powershell
   cd "c:\Projects\TSC Platform"
   git remote -v
   git push -u origin main
   ```
3. In GitHub → **Settings → Actions → General**: allow workflows, read/write permissions for CI.
4. Confirm `.github/workflows/` runs on push (lint, typecheck, test, build).

---

## Step 2 — Neon production database

1. Open [Neon console](https://console.neon.tech) → project for TSC.
2. Copy **pooled connection string** (PostgreSQL):
   ```
   DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>/<DB>?sslmode=require
   ```
3. Verify migration applied (should already show `20250613000000_init`):
   ```powershell
   cd "c:\Projects\TSC Platform"
   $env:DATABASE_URL="<YOUR_NEON_URL>"
   pnpm --filter @tsc/database exec prisma migrate deploy
   ```

---

## Step 3 — Redis (Upstash or Railway)

1. Create Redis instance (Upstash or Railway plugin).
2. Copy connection URL:
   ```
   REDIS_URL=rediss://default:<TOKEN>@<HOST>.upstash.io:6379
   ```
   Or Railway internal URL from plugin dashboard.

---

## Step 4 — Clerk (auth)

1. Open [Clerk Dashboard](https://dashboard.clerk.com) → create/select TSC application(s).
2. Copy keys per surface:

   | Variable | Used on |
   |----------|---------|
   | `CLERK_SECRET_KEY` | Railway API |
   | `CLERK_WEBHOOK_SECRET` | Railway API (when webhooks enabled) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Community, Website, CoreKnot (Vercel) |

3. Configure redirect URLs in Clerk:
   - Community: `http://localhost:3000`, `https://community.theshakticollective.in`
   - Website: `http://localhost:3002`, `https://theshakticollective.in`
   - CoreKnot: `http://localhost:3001`, `https://coreknot.in`

4. **Production:** set `TSC_AUTH_STUB=false` and `NEXT_PUBLIC_AUTH_STUB=false` on Railway + Vercel (remove stub bypass).

---

## Step 5 — Railway (API)

1. Open [Railway Dashboard](https://railway.app) → create/link project.
2. **New service** from GitHub repo; set **Root Directory** to monorepo root (`/`).
3. Build/start (already in repo):
   - Build: `pnpm install && pnpm build` (via `nixpacks.toml` / `railway.json`)
   - Start: `pnpm start:prod:railway` or `node scripts/railway-start.mjs`
4. **Variables** (Railway → Service → Variables):

   | Variable | Example / notes |
   |----------|-----------------|
   | `NODE_ENV` | `production` |
   | `PORT` | Railway injects automatically |
   | `DATABASE_URL` | Neon URL from Step 2 |
   | `REDIS_URL` | From Step 3 |
   | `CLERK_SECRET_KEY` | From Step 4 |
   | `CLERK_WEBHOOK_SECRET` | From Step 4 (optional until webhooks) |
   | `CORS_ORIGIN` | `https://theshakticollective.in,https://community.theshakticollective.in,https://coreknot.in` |
   | `TSC_AUTH_STUB` | `false` |
   | `SENTRY_DSN` | From Step 8 (optional) |
   | `POSTHOG_PROJECT_TOKEN` | From Step 8 (optional) |

5. **Release command** (Railway → Settings → Deploy):
   ```
   pnpm --filter @tsc/database exec prisma migrate deploy
   ```

6. **Custom domain:** Railway → Settings → Networking → add `api.theshakticollective.in` → copy CNAME target.

7. Link CLI locally (optional):
   ```powershell
   cd "c:\Projects\TSC Platform"
   railway link
   railway up
   ```

8. Verify after deploy:
   ```powershell
   curl https://api.theshakticollective.in/api/health/live
   curl https://api.theshakticollective.in/api/health/ready
   ```
   Expected: HTTP 200 JSON.

---

## Step 6 — Cloudflare DNS

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → zone `theshakticollective.in`.
2. Add records:

   | Type | Name | Target | Proxy |
   |------|------|--------|-------|
   | CNAME | `api` | `<RAILWAY_CNAME_FROM_STEP_5>` | DNS only (grey cloud) recommended for Railway |
   | CNAME | `community` | `cname.vercel-dns.com` (or Vercel-provided) | Proxied OK |
   | CNAME | `@` | Vercel apex target | Proxied OK |

3. For **coreknot.in** zone (separate domain):
   - CNAME `@` or `www` → Vercel CoreKnot project target
   - SSL/TLS mode: **Full** if origin is Vercel

4. Wait for propagation (5–30 min), then re-test URLs in Step 9.

---

## Step 7 — Vercel (frontends)

1. Fix/replace invalid `VERCEL_TOKEN` if CLI shows auth errors:
   ```powershell
   vercel logout
   vercel login
   vercel whoami
   ```

2. Create **three projects** (Import Git repo, monorepo):

   | Project name | Root directory | Production domain |
   |--------------|----------------|-------------------|
   | `tsc-website` | `apps/website` | `theshakticollective.in` |
   | `tsc-community` | `apps/community` | `community.theshakticollective.in` |
   | `tsc-coreknot` | `apps/coreknot/client` | `coreknot.in` |

3. **Shared env vars** (Production + Preview where applicable):

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://api.theshakticollective.in/api` |
   | `NEXT_PUBLIC_TSC_API_URL` | `https://api.theshakticollective.in/api` |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Step 4 |
   | `CLERK_SECRET_KEY` | From Step 4 (Website/Community server components) |
   | `TSC_AUTH_STUB` | `false` |
   | `NEXT_PUBLIC_AUTH_STUB` | `false` |
   | `NEXT_PUBLIC_WEBSITE_URL` | `https://theshakticollective.in` |
   | `NEXT_PUBLIC_APP_URL` | Per-app URL (community: `https://community.theshakticollective.in`, etc.) |
   | `NEXT_PUBLIC_POSTHOG_KEY` | From Step 8 (optional) |
   | `NEXT_PUBLIC_SENTRY_DSN` | From Step 8 (optional) |

4. Deploy each project from dashboard or CLI:
   ```powershell
   cd "c:\Projects\TSC Platform\apps\community"
   vercel --prod
   ```

5. Attach custom domains in each Vercel project → **Settings → Domains**.

---

## Step 8 — Observability (optional but recommended)

### Sentry

1. [sentry.io](https://sentry.io) → project for `@tsc/api` and frontends.
2. Copy DSN:
   - Railway: `SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>`
   - Vercel: `NEXT_PUBLIC_SENTRY_DSN=...` per app

### PostHog

1. [PostHog](https://us.posthog.com) → project **Community** / org **The Shakti Collective**.
2. Copy project API key:
   - Railway: `POSTHOG_PROJECT_TOKEN=phc_...`
   - Vercel: `NEXT_PUBLIC_POSTHOG_KEY=phc_...`

### BetterStack (optional)

1. Create heartbeat monitor → copy URL:
   ```
   BETTERSTACK_HEARTBEAT_URL=https://uptime.betterstack.com/api/v1/heartbeat/<id>
   ```
   Set on Railway API service.

---

## Step 9 — Production verification (founder + engineering)

Run from any machine with network access:

```powershell
curl -I https://theshakticollective.in
curl -I https://community.theshakticollective.in
curl -I https://coreknot.in
curl https://api.theshakticollective.in/api/health/ready
```

Expected: marketing + community + coreknot return **HTTP 200**; API ready returns JSON with DB/Redis status.

Optional Playwright smoke (after DNS + secrets):

```powershell
cd "c:\Projects\TSC Platform\e2e"
pnpm exec playwright test
```

---

## Step 10 — P2 services (when ready)

### Cloudflare R2

| Variable | Purpose |
|----------|---------|
| `R2_ACCESS_KEY_ID` | S3-compatible key |
| `R2_SECRET_ACCESS_KEY` | Secret |
| `R2_BUCKET` | Bucket name |
| `R2_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | Public CDN URL |

Set on Railway API when media uploads are enabled.

### Typesense Cloud

| Variable | Purpose |
|----------|---------|
| `TYPESENSE_HOST` | Cluster hostname |
| `TYPESENSE_API_KEY` | Admin/search key |
| `TYPESENSE_PROTOCOL` | `https` |
| `TYPESENSE_PORT` | `443` |

---

## Step 11 — Local Docker infra (optional dev)

From repo root:

```powershell
pnpm start:infra
docker ps
```

Expected: `tsc-postgres` and `tsc-redis` healthy. Copy `apps/api/.env.example` → `apps/api/.env` and app `.env.local` files; keep `TSC_AUTH_STUB=true` for local stub auth.

---

## Canonical URLs (reference)

| Surface | URL |
|---------|-----|
| API | `https://api.theshakticollective.in` |
| Website | `https://theshakticollective.in` |
| Community | `https://community.theshakticollective.in` |
| CoreKnot | `https://coreknot.in` |
| GitHub org | `https://github.com/TheShaktiCollective` |

---

*Founder-only steps. Engineering fixes are tracked in [SETUP-ENGINEERING-STATUS.md](./SETUP-ENGINEERING-STATUS.md).*
