# TSC Platform — Founder Setup Runbook (ARCHIVED)

> **Superseded by:** [.specify/agents/execution/FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) and [docs/SETUP.md](../SETUP.md).  
> Kept for historical reference only (2026-06-15).

**Audience:** Founder only (secrets, DNS, provider dashboards)  
**Repo:** `c:\Projects\TSC Platform`  
**Date:** 2026-06-14  
**Engineering status:** see [SETUP-ENGINEERING-STATUS.md](../../SETUP-ENGINEERING-STATUS.md)

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

## Step 6 — Cloudflare DNS + SSL

**Live probe (2026-06-14):** [reports/platform-infra-live-verify.md](./reports/platform-infra-live-verify.md)

| Host | DNS (1.1.1.1) | HTTP | Blocker |
|------|---------------|------|---------|
| `theshakticollective.in` | A → Cloudflare | **200** | — |
| `www.theshakticollective.in` | (works) | **200** | — |
| `api.theshakticollective.in` | CNAME → Railway | **000** / 404 | Railway custom domain not attached; DNS propagating |
| `community.theshakticollective.in` | **NXDOMAIN** | **000** | Add CNAME in Cloudflare + Vercel domain |
| `coreknot.in` | A → Cloudflare | **timeout** | Vercel CoreKnot domain not serving |

### Zone A — `theshakticollective.in`

Nameservers (already correct): `harvey.ns.cloudflare.com`, `joan.ns.cloudflare.com`.

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **Websites** → zone **`theshakticollective.in`**.
2. **DNS → Records → Add record** for each row below (skip any that already exist):

   | Type | Name | Content (target) | Proxy | Service |
   |------|------|------------------|-------|---------|
   | CNAME | `api` | `tsc-platform-production.up.railway.app` | **DNS only** (grey cloud ☁️) | Railway API |
   | CNAME | `community` | `<VERCEL_COMMUNITY_CNAME>` — from Vercel → tsc-community → Domains | **Proxied** (orange ☁️) | Community |
   | CNAME | `www` | `cname.vercel-dns.com` (or Vercel-provided) | Proxied | Website redirect |
   | CNAME | `@` | `cname.vercel-dns.com` (or Vercel apex / ALIAS target) | Proxied | Website apex |

   **Railway CNAME target:** After Railway → **tsc-platform** → **Settings → Networking → Custom Domain** → add `api.theshakticollective.in`, copy the exact CNAME Railway shows. As of 2026-06-14 the service default hostname is `tsc-platform-production.up.railway.app` (verify in dashboard; CLI: `railway domain api.theshakticollective.in --service tsc-platform` after `railway login`).

   **Vercel CNAME target:** Vercel project → **Settings → Domains** → click domain → **DNS Records** tab shows project-specific value (often `76.76.21.21` A for apex or `cname.vercel-dns.com` CNAME). Do **not** guess — copy from Vercel per project.

3. **SSL/TLS** (zone `theshakticollective.in` → **SSL/TLS**):
   - **Overview → SSL/TLS encryption mode:** **Full (strict)** for Vercel frontends (`@`, `www`, `community`).
   - **Edge Certificates:** **Always Use HTTPS** = On; **Minimum TLS Version** = 1.2.
   - For `api` record: grey-cloud (DNS only) — Railway terminates TLS; Cloudflare SSL mode does not apply to that hostname.

4. **Redirect rule** (optional, recommended): **Rules → Redirect Rules** → `www.theshakticollective.in/*` → `https://theshakticollective.in/$1` (301).

### Zone B — `coreknot.in` (separate zone)

Nameservers: `jillian.ns.cloudflare.com`, `lars.ns.cloudflare.com`.

1. Dashboard → zone **`coreknot.in`** → **DNS → Records**.
2. Add (after Vercel CoreKnot domain is attached in Step 7):

   | Type | Name | Content | Proxy | Service |
   |------|------|---------|-------|---------|
   | CNAME | `@` | `<VERCEL_COREKNOT_CNAME>` from Vercel → tsc-coreknot → Domains | Proxied | CoreKnot apex |
   | CNAME | `www` | `cname.vercel-dns.com` (or Vercel-provided) | Proxied | redirect to apex |

3. **SSL/TLS → Full (strict)**; **Always Use HTTPS** = On.

   **Current status (2026-06-14):** apex + `www` resolve to Cloudflare; HTTPS **times out** — attach Vercel CoreKnot domain and deploy before retest.

### Founder click checklist (both zones)

| # | Where | Action |
|---|--------|--------|
| 1 | Terminal | `railway login` (CLI token expired — blocks `variables`, `logs`, `status`) |
| 2 | Railway → Variables | Confirm `NODE_ENV=production`, `TSC_AUTH_STUB=false`, Neon/Redis/Clerk secrets |
| 3 | Railway → Networking | Add custom domain `api.theshakticollective.in`; wait for certificate **Valid** |
| 4 | Cloudflare → DNS | Add **`community`** CNAME (missing); confirm **`api`** CNAME grey-cloud → Railway |
| 5 | Vercel → each project → Domains | Add domains; copy CNAME targets into Cloudflare |
| 6 | Cloudflare → SSL/TLS | Full (strict) + Always Use HTTPS on both zones |
| 7 | Wait 5–30 min | Re-run probes in Step 9 |

Agents cannot create Cloudflare DNS records without a **Cloudflare API token** (Zone.DNS Edit). Founder must complete dashboard steps above.

### Verify DNS before HTTP

```powershell
nslookup theshakticollective.in 1.1.1.1
nslookup api.theshakticollective.in 1.1.1.1
nslookup community.theshakticollective.in 1.1.1.1
nslookup coreknot.in 1.1.1.1
```

Expected after cutover: all four resolve (no `Non-existent domain`). Then re-test URLs in Step 9.

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

**Latest snapshot (2026-06-14):** Railway default URL healthy (`/ready` 200, DB+Redis ok). Custom API hostname blocked until Railway Networking + DNS propagation. Website OK; community NXDOMAIN; coreknot timeout. Full matrix: [reports/platform-infra-live-verify.md](./reports/platform-infra-live-verify.md).

Run from any machine with network access:

```powershell
# Headers only — note HTTP code and Server header
curl.exe -sI -m 20 -w "`nHTTP:%{http_code}`n" https://theshakticollective.in
curl.exe -sI -m 20 -w "`nHTTP:%{http_code}`n" https://community.theshakticollective.in
curl.exe -sI -m 20 -w "`nHTTP:%{http_code}`n" https://coreknot.in
curl.exe -sI -m 20 -w "`nHTTP:%{http_code}`n" https://api.theshakticollective.in/api/health/live
curl.exe -s https://api.theshakticollective.in/api/health/ready
```

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Could not resolve host` / NXDOMAIN | Missing Cloudflare DNS record | Step 6 — add CNAME |
| HTTP **525** | Cloudflare proxied + bad origin SSL | Grey-cloud API to Railway; Vercel domains on Full (strict) |
| HTTP **522** / curl timeout | Origin down or domain not on host | Railway deploy + custom domain; Vercel domain attach |
| HTTP **404** from `railway-hikari` | Railway service not running / wrong URL | Fix deploy (see [reports/railway-runtime-fix.md](./reports/railway-runtime-fix.md)) |
| HTTP **200** + `Server: cloudflare` + `X-Vercel-*` | OK for frontends | — |

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
