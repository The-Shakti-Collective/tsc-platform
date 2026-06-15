# Deployment Certificate (Agent 23)

> **Date:** 2026-06-15  
> **Verdict:** **FAIL** — configs and docs exist; production services not verified live; founder checklist incomplete.

Cross-reference: [DEPLOYMENT-ARCHITECTURE.md](../architecture/DEPLOYMENT-ARCHITECTURE.md) · [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md)

---

## Service matrix

| Service | Target host | Config in repo | Prod verified |
|---------|-------------|----------------|---------------|
| Platform API | Railway | ✅ `railway.json`, `nixpacks.toml`, `apps/api/railway.toml` | ❌ Not live |
| CoreKnot API | Railway | ✅ `apps/coreknot/server/railway.toml` | ❌ Not live |
| CoreKnot workers | Railway (2nd service) | ✅ `RUN_WORKERS=true` documented | ❌ |
| Website | Vercel | ✅ `apps/website/vercel.json`, region `bom1` | ❌ Founder step |
| Community | Vercel | ✅ `apps/community/vercel.json` | ❌ |
| CoreKnot client | Vercel | ✅ `apps/coreknot/client/vercel.json` | ⚠️ Install path issue H5 |
| Neon Postgres | Neon | ✅ `DATABASE_URL` in env templates | ❌ Migration drift C2 |
| Redis | Upstash/Railway | ✅ env templates | ❌ |
| Clerk | Clerk cloud | ✅ keys in `.env.example` | ❌ Webhooks not wired |
| PostHog | Cloud | ✅ website + community examples | ⚠️ Required for contact form |
| Sentry | Cloud | ✅ `sentry.bootstrap` in API | ❌ DSN in prod unverified |
| Cloudflare DNS | Cloudflare | ✅ Documented in architecture | ❌ Founder step |
| R2 | Cloudflare | ⚠️ Scaffold in `media/r2-storage.service.ts` | ❌ |
| Typesense | Cloud | ⚠️ Scaffold | ❌ |

---

## Domains (canonical)

| Domain | Target |
|--------|--------|
| `theshakticollective.in` | Vercel Website |
| `theshakticollective.in/community` | Vercel Community |
| `api.theshakticollective.in` | Railway Platform API |
| `coreknot.in` | Vercel CoreKnot client |
| `api.coreknot.in` | Railway CoreKnot API |

---

## Health checks

| Service | Path | Config |
|---------|------|--------|
| Platform API | `/api/health/live` | `apps/api/railway.toml` |
| Platform API ready | `/api/health/ready` | `health.controller.ts` |
| CoreKnot | `/api/health` | `apps/coreknot/server/railway.toml` |
| CoreKnot ready | `/api/health/ready` | Postgres + Mongo probe |
| Community | `/api/health` redirect | `vercel.json` |

---

## Environment variables

Templates present:

- `.env.shared.example`
- `.env.platform.example`
- `.env.coreknot.example`
- Per-app `.env.example` files

Documented in [ENV-STANDARD.md](../architecture/ENV-STANDARD.md).

**Gaps:**

| Var | Issue |
|-----|-------|
| `AUTH_STUB` | Must be `false` in prod |
| `LEGACY_JWT_BRIDGE_ENABLED` | Should be `false` post-cutover |
| `COREKNOT_MONGO_REQUIRED` | Must become `false` after sunset |
| `MONGODB_URI_PROD` | Still required today for CoreKnot |

---

## CI/CD

| Workflow | Purpose |
|----------|---------|
| `.github/workflows/ci.yml` | Aggregate CI |
| `ci-api.yml`, `ci-community.yml`, `ci-website.yml` | Per-app |
| `typecheck.yml`, `lint.yml`, `test.yml` | Split jobs |
| `runtime-validation.yml` | CoreKnot migration dry-run |

Deploy trigger: merge to `main` → Railway/Vercel (per [CI-CD-STANDARD.md](../architecture/CI-CD-STANDARD.md)) — **not verified in this audit**.

---

## Legacy / conflicting deploy artifacts

| Artifact | Action |
|----------|--------|
| `apps/coreknot/render.yaml` | REMOVE after Railway verified (H6) |
| Render platform rule in Cursor | Architecture says Railway, not Render |

---

## SSL / DNS

- Vercel: automatic TLS for custom domains
- Railway: custom domain TLS via Railway dashboard
- Cloudflare: DNS + optional proxy — founder task

Community HSTS: partial — Website has `Strict-Transport-Security`; Community has lighter headers.

---

## Build verification (local)

| Check | Result |
|-------|--------|
| `pnpm --filter @tsc/api typecheck` | ✅ PASS |

Full prod build/deploy not executed in this audit.

---

## Certification

| Criterion | Result |
|-----------|--------|
| Deployment configs present | ✅ |
| Production deployment verified | ❌ |
| No deployment blockers | ❌ Founder 0/8 |
| Env/secrets documented | ✅ |
| Health checks configured | ✅ |

**Agent 23 verdict: FAIL**
