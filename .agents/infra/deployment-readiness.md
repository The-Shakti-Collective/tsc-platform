# Deployment Readiness Scorecard

Last updated: 2026-06-13 (Recovery Sprint — Agent 9)

## Summary

| Service | Infra docs | Deploy config | Health endpoint | CI/CD template | Platform account | **Ready** |
|---------|------------|---------------|-----------------|------------------|------------------|-----------|
| **tsc-api** | ✅ | ✅ `railway.json` | ✅ `/health`, `/health/ready` | ✅ | ⬜ Manual | **Staging-ready*** |
| **tsc-community** | ✅ | ✅ `vercel.json` | ✅ `/api/health` | ✅ | ⬜ Manual | **Staging-ready*** |
| **tsc-coreknot** | ✅ | ✅ `vercel.json` | ✅ `/health.json` | ✅ | ⬜ Manual | **Blocked**† |
| **tsc-web** | ✅ | ✅ template | ⬜ scaffold only | ✅ | ⬜ Manual | **Not started** |
| **tsc-docs** | ✅ runbook | ⬜ partial | ⬜ `/` only | ⬜ | ⬜ Manual | **Not started** |
| **tsc-infra** | ✅ | ✅ scripts | N/A | ✅ templates | N/A | **Ready to bootstrap** |

\* Requires: monorepo `pnpm build` green, Neon/Upstash/Railway/Vercel accounts provisioned, secrets set  
† CoreKnot monorepo build still has stub client dependencies

---

## Gaps (action required)

### P0 — Blockers

| Gap | Owner | Action |
|-----|-------|--------|
| Monorepo build not verified green | Platform | Run `pnpm build`; fix per stage1 report |
| GitHub org repos not created | Platform | Run runbook Appendix bootstrap |
| No Railway/Vercel projects linked | Platform | Create projects; set org secrets |
| Neon + Upstash not provisioned | Platform | Create staging DBs first |

### P1 — Pre-staging

| Gap | Action |
|-----|--------|
| Clerk staging app + webhook URL | Configure dashboard; set `CLERK_WEBHOOK_SECRET` on Railway |
| Typesense staging cluster | Provision; set env; run index sync job |
| R2 staging bucket + token | Create `tsc-assets-staging`; set R2_* on Railway |
| Cloudflare DNS records | Add CNAMEs per `org-scaffold/tsc-infra/cloudflare/dns-records.md` |
| API `CORS_ORIGIN` for staging frontends | Comma-separated staging URLs on Railway |

### P2 — Pre-production

| Gap | Action |
|-----|--------|
| tsc-web greenfield app | Create repo + Next.js scaffold |
| tsc-docs OpenAPI CI refresh | Wire OpenAPI publish on api release tags |
| CoreKnot real API client | Replace stubs before prod |
| External uptime monitors | Point at `/health/ready` and frontend `/api/health` |
| Neon prod backup verification | Schedule per runbook Phase G |

---

## Files created this sprint

### `.agents/infra/`

- `README.md`
- `environment-matrix.md`
- `health-checks.md`
- `rollback-strategy.md`
- `deployment-readiness.md`
- `services/api.md`, `community.md`, `coreknot.md`, `website.md`

### `org-scaffold/tsc-infra/`

- `cloudflare/dns-records.md`, `r2-setup.md`
- `clerk/setup.md`
- `typesense/setup.md`
- `railway/tsc-api.staging.json`, `tsc-api.prod.json`
- `vercel/tsc-web.json`, `tsc-community.json`, `tsc-coreknot.json`, `tsc-docs.json`, `api-health.js`
- `scripts/setup-local.ps1`, `health-check.ps1`, `health-check.sh`
- `scripts/deploy-api.ps1`, `deploy-vercel.ps1`, `rollback-railway.ps1`
- `docs/environment-matrix.md`, `health-checks.md`, `rollback-strategy.md`

### Application code

- `apps/api/src/modules/health/` — liveness + readiness
- `apps/api/src/main.ts` — exclude `/health` from global prefix
- `apps/community/src/app/api/health/route.ts`
- `apps/coreknot/client/public/health.json`

---

## Verification checklist

```powershell
# 1. Local infra
.\org-scaffold\tsc-infra\scripts\setup-local.ps1

# 2. API health (requires API running + DATABASE_URL)
Invoke-RestMethod http://localhost:4000/health/ready

# 3. Community health
Invoke-RestMethod http://localhost:3000/api/health

# 4. Full smoke (staging URLs after deploy)
.\org-scaffold\tsc-infra\scripts\health-check.ps1 -Environment staging
```
