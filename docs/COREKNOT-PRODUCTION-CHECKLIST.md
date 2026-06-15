# CoreKnot production checklist

> **Verified:** 2026-06-15 (post `023ff62` push)  
> **Authority:** [coreknot-production-runbook.md](./coreknot-production-runbook.md) · [FOUNDER-COREKNOT-LAUNCH.md](./FOUNDER-COREKNOT-LAUNCH.md)  
> **Deploy target:** Vercel (client) + Railway (API + worker) + Neon + Redis

Automated probe summary from verification run:

| Probe | Result | Notes |
|-------|--------|-------|
| `pnpm smoke:coreknot:api` | **PASS** | health, ready, tasks/crm 401 |
| `GET api.coreknot.in/api/health/ready` | **PASS** 200 | postgres + redis ok; supabase not_configured |
| `GET api.coreknot.in/api/openapi.json` | **PASS** 200 | 12.8 KB spec |
| `GET coreknot.in/` | **FAIL** | DNS/connect timeout |
| Vercel preview (`tsc-coreknot-*`) | **BLOCKED** | Deployment queued; URL returns 401 (protection) |
| CI — CoreKnot Client | **FAIL** | Vite build: missing `./reports/*` modules |
| CI — main (server tests) | **FAIL** | `Cannot find module 'jest-resolve'` |
| CI — runtime-validation | **FAIL** | `Cannot find package 'dotenv'` |
| CI — security | **FAIL** | 31 dependency audit findings |
| Railway `coreknot-worker` | **FAIL** | Latest deploy FAILED; no active instances |
| Railway `coreknot-api` (Dashboard) | **WARN** | Custom domain attached; latest deploy FAILED in snapshot — live API responds 200 (older revision or alternate route) |

---

## 1. Frontend (Vercel — `apps/coreknot/client`)

Project: **tsc-coreknot** · Root: `apps/coreknot/client`

### 1.1 Build & CI

| Check | Status | Action |
|-------|--------|--------|
| `pnpm run build` (client) | **FAIL** | Missing modules under `src/components/admin/reports/` |
| Vitest unit tests | **PASS** | 9+ test files green in CI (build fails before gate completes) |
| ESLint | **PASS** | Runs; build is blocker |
| Root cause: `.gitignore` `reports/` | **FAIL** | Repo root line 23 ignores **all** `reports/` paths — admin report components exist locally but are **not tracked** |

**Fix:** Narrow ignore to `.agents/reports/` (or `**/agent-reports/`), then `git add -f apps/coreknot/client/src/components/admin/reports/` and add/copy `DailyLogHoursChart.jsx` into that folder (imported by `MonthlyReportBody.jsx`).

### 1.2 Auth & routing

| Check | Status | Notes |
|-------|--------|-------|
| Legacy JWT login | **NOT PROBED** | Client not deployable until build fixed |
| Clerk cutover (`VITE_CLERK_PUBLISHABLE_KEY`) | **PENDING** | Founder — see AUTH-ARCHITECTURE.md |
| `DEBUG_BYPASS` / `VITE_AUTH_STUB` absent in prod | **MANUAL** | Verify Vercel env |
| Protected routes redirect to login | **NOT PROBED** | |
| Force password change gate | **PASS (unit)** | `ForcePasswordChangeGate.test.jsx` |
| Admin RBAC / page permissions | **NOT PROBED** | `PagePermissionsEditor` shipped |

### 1.3 CRM, tasks, mail

| Check | Status | Notes |
|-------|--------|-------|
| CRM leads list/detail | **NOT PROBED** | API returns 401 without token (expected) |
| Tasks board / filters | **NOT PROBED** | |
| Mail template studio | **NOT PROBED** | |
| Campaign wizard validation | **PASS (unit)** | |
| Monthly / aggregated reports UI | **BLOCKED** | Depends on gitignored `reports/` components |

### 1.4 PWA, static assets, rewrites

| Check | Status | Notes |
|-------|--------|-------|
| `vercel.json` `/api/*` → `api.coreknot.in` | **CONFIGURED** | Confirmed in deployment inspect |
| `vercel.json` `/socket.io/*` proxy | **CONFIGURED** | |
| SPA fallback to `index.html` | **CONFIGURED** | |
| PWA manifest + icons | **PASS (build step)** | `generate-icons` runs pre-build |
| Static asset load on preview | **NOT PROBED** | No successful deployment |
| Preview `/api/health/ready` via rewrite | **NOT PROBED** | Should proxy to Railway when client is live |

### 1.5 Realtime (Socket.IO)

| Check | Status | Notes |
|-------|--------|-------|
| Socket connect to API origin | **NOT PROBED** | Rewrite configured; needs live client + auth |
| Reconnect / dedupe | **PASS (unit)** | `realtime.test.js` |

### 1.6 Keyboard shortcuts & admin flags

| Check | Status | Notes |
|-------|--------|-------|
| Admin-only shortcut filtering | **PASS (unit)** | Fixed in `023ff62` — `shortcutDefaultsCore.js` |
| Shortcut overlay / palette | **NOT PROBED** | |

---

## 2. Backend (Railway — `apps/coreknot/server`)

### 2.1 Health & readiness

| Endpoint | Status | Response |
|----------|--------|----------|
| `GET /api/health` | **PASS** | `status: HEALTHY`, `ready: true` |
| `GET /api/health/ready` | **PASS** | postgres connected, redis connected |
| `GET /api/openapi.json` | **PASS** | 200 |

**Dependencies (live):**

```json
{
  "postgres": { "ok": true, "state": "connected", "required": true },
  "mongodb": { "ok": true, "state": "optional", "required": false },
  "redis": { "ok": true, "state": "connected" },
  "supabase": { "ok": false, "state": "not_configured" }
}
```

### 2.2 Auth

| Check | Status | Notes |
|-------|--------|-------|
| Unauthenticated `/api/tasks` | **PASS** | 401 + traceId |
| Unauthenticated `/api/crm/leads` | **PASS** | 401 + traceId |
| JWT cookie / Bearer validation | **NOT PROBED** | Needs staff credentials |
| `DEBUG_BYPASS` disabled in prod | **MANUAL** | Railway env audit |
| Clerk webhook (if enabled) | **PENDING** | Founder |

### 2.3 CRM, tasks, artists

| Check | Status | Notes |
|-------|--------|-------|
| Postgres store flags (`COREKNOT_*_STORE=postgres`) | **CONFIGURED** | See `railway.env.example` |
| CRM CRUD smoke | **NOT PROBED** | Auth required |
| Tasks CRUD smoke | **NOT PROBED** | Auth required |
| Artist OS documents tab | **PASS (unit)** | Mock react-query in `023ff62` |

### 2.4 Workers & cron

| Check | Status | Notes |
|-------|--------|-------|
| `coreknot-worker` Railway service running | **FAIL** | Latest deploy FAILED; 0 active instances |
| Worker health HTTP (`/api/health/ready` on worker PORT) | **NOT PROBED** | Internal only; no public domain expected |
| Mail campaign dispatch (202 → worker) | **NOT PROBED** | Blocked on worker |
| `RUN_WORKERS=false` on API service | **MANUAL** | Verify Railway env split |

Worker health server (`workers/workerHealthServer.js`) exposes `/api/health`, `/api/health/ready`, `/api/health/live` on `config.PORT` when `RUN_WORKERS=true`.

### 2.5 CI (server)

| Check | Status | Notes |
|-------|--------|-------|
| `test:ci` (Jest subset) | **FAIL** | Missing `jest-resolve` in server package |
| Cutover profile validation | **FAIL** | Root script needs `dotenv` dependency |

---

## 3. Storage (UploadThing / R2 / attachments)

| Check | Status | Notes |
|-------|--------|-------|
| UploadThing route on API | **NOT PROBED** | Client bundles `@uploadthing/react` |
| R2 / Cloudflare object storage | **PENDING** | Founder — FOUNDER-TASKS |
| GridFS backup disabled | **CONFIGURED** | `COREKNOT_DISABLE_GRIDFS_BACKUP=true` |
| Attachment delete on finance docs | **CODE PRESENT** | UploadThing delete in controller |
| `ck_legacy_documents` Postgres migration | **MANUAL** | Run parity scripts before cutover |

---

## 4. Cross-service flow

```
Browser → coreknot.in (Vercel)
       → /api/* rewrite → api.coreknot.in (Railway)
       → Neon Postgres + Redis
       → coreknot-worker (Railway, RUN_WORKERS=true) via Redis queue
```

| Check | Status | Notes |
|-------|--------|-------|
| Client → Vercel rewrite → Railway API | **CONFIGURED** | Live API reachable; client build blocked |
| API → Neon Postgres | **PASS** | health dependency ok |
| API → Redis | **PASS** | health dependency ok |
| API → Worker (mail campaigns) | **FAIL** | Worker not running |
| CORS (`CORS_ALLOWED_ORIGINS`) | **MANUAL** | Must include Vercel + `coreknot.in` |
| `FRONTEND_URL` / tracking URLs | **CONFIGURED** | Template: `https://coreknot.in` |

---

## 5. Edge cases

| Scenario | Status | Notes |
|----------|--------|-------|
| Mongo-off (`COREKNOT_MONGO_REQUIRED=false`) | **PASS** | API reports mongodb optional |
| Postgres-primary all P0/P1 stores | **CONFIGURED** | Env template complete |
| Empty states (CRM, tasks, mail) | **NOT PROBED** | |
| Admin RBAC denied routes | **NOT PROBED** | |
| Supabase secondary disabled | **PASS** | `not_configured` — expected |
| Railway domain 404 "Application not found" | **PASS** | Custom domain resolves (not 404) |

---

## 6. Founder / manual steps

From [FOUNDER-COREKNOT-LAUNCH.md](./FOUNDER-COREKNOT-LAUNCH.md):

| Step | Status | Notes |
|------|--------|-------|
| Neon `DATABASE_URL` + PITR | **ASSUMED OK** | Postgres connected in health |
| Railway API + worker (repo root, `railway.json`) | **PARTIAL** | API live; worker FAILED |
| `api.coreknot.in` DNS → Railway | **PASS** | Health 200 |
| `coreknot.in` DNS → Vercel | **FAIL** | Connection timeout |
| Vercel `tsc-coreknot` + env vars | **PARTIAL** | Deploy queued; check `RENDER_API_PROXY_URL` |
| Upstash / Railway Redis | **PASS** | Connected |
| Resend domain + API key | **MANUAL** | Not probed |
| JWT_SECRET + ENCRYPTION_KEY | **ASSUMED OK** | API auth middleware active |
| Sentry + PostHog + BetterStack | **MANUAL** | |
| Disable Vercel Deployment Protection (or bypass token) | **NEEDED** | Preview URLs return 401 |
| Post-deploy smoke + test campaign 202 | **BLOCKED** | Worker down + client build |

**Required Vercel env (production):**

```env
VITE_API_URL=https://api.coreknot.in
RENDER_API_PROXY_URL=https://api.coreknot.in
VITE_TSC_API_URL=https://api.theshakticollective.in/api
VITE_SENTRY_DSN=...
VITE_POSTHOG_KEY=...
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

---

## 7. Verification commands

```powershell
# From repo root — API smoke (PASS as of 2026-06-15)
$env:COREKNOT_API_URL='https://api.coreknot.in'
pnpm smoke:coreknot:api

# Health probes
curl https://api.coreknot.in/api/health/ready
curl https://api.coreknot.in/api/openapi.json

# Client build (currently FAIL until reports/ gitignore fixed)
cd apps/coreknot/client
pnpm run build

# Vercel status
cd apps/coreknot/client
vercel ls

# CI
gh run list --limit 5
gh run view <run-id> --log-failed
```

---

## 8. Recommended next fixes (priority)

### P0 — unblock client deploy

1. **Fix root `.gitignore`** — replace blanket `reports/` with `.agents/reports/` so `apps/coreknot/client/src/components/admin/reports/` is tracked.
2. **Commit admin report components** — `ReportRangeControls`, `MonthlyReportBody`, tables, and `DailyLogHoursChart` (copy from `components/project/` or re-export).
3. **Re-run** `pnpm run build` locally, push, confirm **CI — CoreKnot Client** green.
4. **Wait for Vercel production deploy** (currently queued behind failed build).

### P1 — Railway worker + DNS

5. **Redeploy `coreknot-worker`** — inspect Railway logs for FAILED deploy; ensure repo root + `RUN_WORKERS=true`.
6. **Configure `coreknot.in` Cloudflare CNAME** → Vercel.
7. **Vercel deployment protection** — disable for preview smoke or add bypass token to CI.

### P2 — CI hygiene

8. Add **`jest-resolve`** to `apps/coreknot/server` devDependencies (or fix `runJest.js`).
9. Add **`dotenv`** to root `package.json` for `migrate:coreknot:verify-cutover`.
10. Triage **security audit** (esbuild/vite transitive — 31 findings).

### P3 — post-green validation

11. Authenticated E2E: `pnpm test:e2e:coreknot`
12. Mail campaign test dispatch (202 → worker logs → Resend)
13. Clerk cutover when founder keys ready

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [coreknot-production-runbook.md](./coreknot-production-runbook.md) | Full deploy runbook |
| [FOUNDER-COREKNOT-LAUNCH.md](./FOUNDER-COREKNOT-LAUNCH.md) | Founder copy-paste steps |
| [AUTH-ARCHITECTURE.md](./architecture/AUTH-ARCHITECTURE.md) | Clerk vs JWT matrix |
| [MONGO-SUNSET-REPORT.md](./architecture/MONGO-SUNSET-REPORT.md) | Mongo deprecation |
| `apps/coreknot/server/railway.env.example` | Railway env template |
