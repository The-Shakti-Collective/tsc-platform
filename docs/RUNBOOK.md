# TSC Platform — Runbook

> Incident response and common failures. Ops context: [OPERATIONS.md](./OPERATIONS.md)

## Health check reference

| Service | Liveness | Readiness |
|---------|----------|-----------|
| Platform API | `GET /api/health/live` | `GET /api/health/ready` (Postgres + Redis) |
| CoreKnot API | `GET /api/health` | `GET /api/health/ready` (Postgres + Mongo during cutover) |

**Note:** Readiness fails if dependency down — use for deploy gates, not outer load balancer unless dependencies stable.

---

## Platform API down

**Symptoms:** Community/Website API errors, 502 from Railway

**Steps:**

1. Railway dashboard → tsc-platform-api → Logs
2. Verify `DATABASE_URL`, `PORT`, `CLERK_SECRET_KEY`
3. `pnpm db:generate` included in build — check build log for Prisma errors
4. Redeploy last green deployment
5. Neon: check connection limit / IP allowlist

---

## CoreKnot API down

**Symptoms:** Client login fails, CRM 500s

**Steps:**

1. Check `GET /api/health` — `mongodb.state`, `postgres.state`
2. If Mongo disconnected: verify `MONGODB_URI_PROD`, Atlas IP allowlist
3. If Postgres disabled: set `COREKNOT_POSTGRES_ENABLED=true` + valid `DATABASE_URL`
4. JWT errors: verify `JWT_SECRET` matches between deploys
5. See [coreknot-production-runbook.md](./coreknot-production-runbook.md) for legacy detail

---

## CoreKnot mail campaigns stuck

**Symptoms:** Campaigns queued, not sending

**Steps:**

1. Verify worker service running (`RUN_WORKERS=true`)
2. Verify `REDIS_URL` on both API and worker
3. Check worker logs for BullMQ connection errors
4. Empty `REDIS_URL` = dev fallback only — not valid prod

---

## Auth failures (Platform)

**Symptoms:** 401 on all API routes

**Steps:**

1. Prod must **not** have `TSC_AUTH_STUB=true`
2. Verify Clerk keys match frontend + API apps
3. Check token expiry / clock skew
4. Legacy bridge: if `COREKNOT_JWT_BRIDGE` enabled, verify secret alignment (sunset path)

---

## Auth failures (CoreKnot staff)

**Symptoms:** Login redirect loop, 401

**Steps:**

1. Verify `JWT_SECRET` on Railway
2. Check `FRONTEND_URL` / CORS origins include Vercel domain
3. Google OAuth: verify callback URLs in GCP console
4. Dev only: `DEBUG_BYPASS` must never be true in prod

---

## Database migration failure (P3018)

**Symptoms:** `prisma migrate deploy` fails on Railway

**Steps:**

1. Compare Neon schema vs `packages/database/prisma/migrations`
2. Run parity: `pnpm migrate:coreknot:count-parity`
3. Founder: `prisma migrate resolve` for failed migration after manual fix
4. Never `db push` on production

---

## Mongo → Postgres cutover issues

**Symptoms:** Missing leads/tasks after flag flip

**Steps:**

1. Roll back store flag to `mongo` for affected domain
2. Re-run ETL: `pnpm migrate:coreknot:p0:execute`
3. Compare counts: `pnpm migrate:coreknot:count-parity`
4. Document in incident log; do not dual-write manually

Full path: [architecture/MONGO-SUNSET-REPORT.md](./architecture/MONGO-SUNSET-REPORT.md)

---

## DNS / SSL

**Symptoms:** NXDOMAIN, certificate errors

**Steps:**

1. Cloudflare DNS: verify CNAME targets Railway/Vercel
2. Railway/Vercel: verify custom domain attached and verified
3. Wait for propagation (up to 48h for apex)

Founder checklist: [FOUNDER-TASKS.md](../.specify/agents/execution/FOUNDER-TASKS.md) Step 3

---

## Deploy rollback (quick)

| Platform | Action |
|----------|--------|
| Vercel | Deployments → ⋮ → Promote to Production |
| Railway | Deployments → Redeploy previous |
| Database | Neon → Restore branch (founder approval) |

---

## Contacts & docs

| Doc | Use |
|-----|-----|
| [MASTER-PRODUCTION-ARCHITECTURE.md](./architecture/MASTER-PRODUCTION-ARCHITECTURE.md) | Architecture authority |
| [FOUNDER-COREKNOT-LAUNCH.md](./FOUNDER-COREKNOT-LAUNCH.md) | CoreKnot launch checklist |
| [TECH-DEBT-ROADMAP.md](./architecture/TECH-DEBT-ROADMAP.md) | Known gaps |
| [elimination/OBSERVABILITY-PLAN.md](./elimination/OBSERVABILITY-PLAN.md) | Sentry / PostHog / BetterStack |
