# CoreKnot production runbook

End-to-end guide to deploy and operate CoreKnot in production.

**Domains (canonical):**

| Surface | URL |
|---------|-----|
| Client | `https://coreknot.in` (also `coreknot.theshakticollective.in`) |
| API | `https://api.coreknot.in` (or Render/Railway default until DNS cutover) |

---

## 1. Prerequisites

Complete founder-owned setup before first deploy.

| Provider | Purpose | Founder doc |
|----------|---------|-------------|
| **Neon** | Postgres (`DATABASE_URL`) when store flags use postgres | Step 4 Railway + migration docs |
| **MongoDB Atlas** | Legacy primary until full postgres cutover | `MONGODB_URI_PROD` |
| **Upstash / Railway Redis** | Mail campaigns (`REDIS_URL`) | [mail-campaign-workers.md](./migration/mail-campaign-workers.md) |
| **Resend** | Transactional + campaign mail | Verify `theshakticollective.in` domain |
| **Clerk** | SSO cutover (optional; legacy JWT still supported) | [FOUNDER-TASKS.md](../.specify/agents/execution/FOUNDER-TASKS.md) Step 2 |
| **Sentry** | Error tracking | [coreknot-observability-setup.md](./coreknot-observability-setup.md) |
| **PostHog** | Product analytics | Same |
| **Cloudflare** | DNS for `coreknot.in`, `api.coreknot.in` | FOUNDER-TASKS Step 3 |

Generate secrets locally (never commit):

```powershell
# JWT + encryption
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Deploy services

### 2a. CoreKnot API (Railway recommended)

**Monorepo path:** `apps/coreknot/server`  
**Reference:** `apps/coreknot/server/railway.toml`

| Setting | Value |
|---------|-------|
| Start command | `node server.js` |
| Health check | `/api/health` or `/api/health/ready` |
| `RUN_WORKERS` | `false` |
| `NODE_ENV` | `production` |
| Bind | `0.0.0.0:$PORT` (platform default) |

**Required env vars:**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI_PROD=mongodb+srv://...
JWT_SECRET=<64+ char secret>
ENCRYPTION_KEY=<64 hex chars>
REDIS_URL=rediss://...
RESEND_API_KEY=re_...
FRONTEND_URL=https://coreknot.in
CORS_ALLOWED_ORIGINS=https://coreknot.in,https://www.coreknot.in
```

**Optional:** `SENTRY_DSN`, `BETTERSTACK_HEARTBEAT_URL`, Clerk keys, Postgres flags — see `apps/coreknot/server/.env.example`.

### 2b. CoreKnot worker (separate service)

Same repo root, **second Railway/Render service:**

| Setting | Value |
|---------|-------|
| Start command | `node workers/startWorkers.js` |
| `RUN_WORKERS` | `true` |
| Public HTTP | Not required |

Share `REDIS_URL`, `MONGODB_URI_PROD`, `RESEND_API_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY` with API.

Full checklist: [mail-campaign-workers.md](./migration/mail-campaign-workers.md).

### 2c. CoreKnot client (Vercel)

**Root directory:** `apps/coreknot/client`

| Setting | Value |
|---------|-------|
| Build | `npm run vercel-build` |
| Output | `dist` |

**Production env:**

```env
VITE_API_URL=https://api.coreknot.in
RENDER_API_PROXY_URL=https://api.coreknot.in
VITE_TSC_API_URL=https://api.theshakticollective.in/api
VITE_SENTRY_DSN=...
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...   # when Clerk cutover complete
```

`generateVercelConfig.cjs` writes `/api` rewrites from `RENDER_API_PROXY_URL`.

**Do not set:** `DEBUG_BYPASS`, `VITE_ENABLE_DEV_BYPASS`, `VITE_AUTH_STUB=true` in production.

---

## 3. DNS (Cloudflare)

Zone: `coreknot.in`

| Type | Name | Target |
|------|------|--------|
| CNAME | `@` | Vercel (cname.vercel-dns.com) |
| CNAME | `www` | Vercel |
| CNAME | `api` | Railway or Render host |

Also add `coreknot.theshakticollective.in` CNAME → Vercel on main zone if using collective subdomain.

---

## 4. Post-deploy verification

```powershell
# Health
curl https://api.coreknot.in/api/health
curl https://api.coreknot.in/api/health/ready

# OpenAPI
curl https://api.coreknot.in/api/openapi.json

# Client loads
curl -I https://coreknot.in
```

### Smoke tests (from dev machine with stack or prod URLs)

```powershell
pnpm start                    # local full stack
pnpm test:e2e:coreknot        # Playwright coreknot-smoke

# Server unit/integration
cd apps/coreknot/server
pnpm test
```

### Mail campaign dispatch

1. Create small test campaign (≤5 recipients).
2. `POST /api/campaigns/:id/dispatch` → **202**, status `Queued` → `Sending`.
3. Worker logs show `Processing campaign.send batch 0`.
4. Resend dashboard shows deliveries.

---

## 5. Rollback

See [apps/coreknot/docs/DEPLOY_ROLLBACK.md](../apps/coreknot/docs/DEPLOY_ROLLBACK.md).

Summary:

- **API/Worker:** redeploy previous platform revision; revert env.
- **Postgres flags:** set `COREKNOT_*_STORE=mongo` per domain.
- **Client:** Vercel promote previous deployment.

---

## 6. Auth cutover (Clerk vs legacy JWT)

**Current production path:** Legacy email/password + JWT cookies (`JWT_SECRET`).

**Clerk cutover (founder):**

1. Create Clerk application; add Google/email OTP as needed.
2. Set `CLERK_SECRET_KEY` + webhook secret on API when Nest compat layer used; for CoreKnot Express set keys per `.env.example`.
3. Set `VITE_CLERK_PUBLISHABLE_KEY` on Vercel.
4. **Disable** `DEBUG_BYPASS` everywhere (already blocked when `NODE_ENV=production`).
5. Run auth validation: `docs/migration/auth-validation-report.md`.

Dev admin bootstrap (`ensureDevAdminUser`) **skipped in production**.

---

## 7. Founder checklist (CoreKnot subset)

From [FOUNDER-TASKS.md](../.specify/agents/execution/FOUNDER-TASKS.md):

1. ☐ GitHub org repos + CI (`The-Shakti-Collective/tsc-platform` or `tsc-coreknot`)
2. ☐ Clerk keys (if SSO cutover)
3. ☐ Cloudflare DNS — `coreknot.in`, `api.coreknot.in`
4. ☐ Railway — API + worker services, env vars
5. ☐ Vercel — client project, `RENDER_API_PROXY_URL`
6. ☐ Upstash Redis — `REDIS_URL` on API + worker
7. ☐ Neon — `DATABASE_URL` when postgres flags enabled
8. ☐ Resend — domain verified, `RESEND_API_KEY`
9. ☐ Sentry + PostHog + BetterStack — see observability doc
10. ☐ Atlas IP allowlist for Railway/Render egress
11. ☐ Post-deploy smoke + test campaign 202

---

## Related files

| File | Purpose |
|------|---------|
| `ENVIRONMENT_GUIDE.md` | Local/staging/prod env matrix |
| `apps/coreknot/server/.env.example` | API env template |
| `apps/coreknot/client/.env.example` | Client env template |
| `apps/coreknot/render.yaml` | Render Blueprint reference |
| `apps/coreknot/server/railway.toml` | Railway health + start |
| `docs/migration/mail-campaign-workers.md` | Worker deploy |
