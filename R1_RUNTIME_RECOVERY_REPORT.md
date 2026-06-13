# R1 Runtime Recovery Report

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Status:** READY_FOR_DEPLOYMENT (pending Railway redeploy)

---

## ROOT CAUSE

Railway built **only the API** (or API completed while workspace packages did not emit `dist/`). At runtime NestJS `require("@tsc/database")` resolves to `packages/database/dist/index.js` via pnpm workspace symlink — **file missing** → crash before health endpoints.

Classification: **B — workspace dist not built**, not wrong import path.

---

## FIXES APPLIED

| # | Fix |
|---|-----|
| 1 | Root `build` → `turbo run build --filter=@tsc/api...` (full dep graph) |
| 2 | `"files": ["dist"]` on all 14 workspace packages |
| 3 | `@tsc/database` package.json cleaned; `main`/`types`/`exports` verified |
| 4 | `scripts/verify-workspace-dist.mjs` + `pnpm verify:dist` |
| 5 | `nixpacks.toml`: `db:generate` + `build` + `verify:dist` |
| 6 | `apps/api/railway.toml` buildCommand aligned |
| 7 | `.github/workflows/runtime-validation.yml` (new) |
| 8 | `.github/workflows/build.yml` — added verify step |

---

## FILES CHANGED

```
package.json
nixpacks.toml
apps/api/railway.toml
packages/database/package.json
packages/constants/package.json
packages/types/package.json
packages/contracts/package.json
packages/permissions/package.json
packages/analytics/package.json
packages/workspace/package.json
packages/projects/package.json
packages/tasks/package.json
packages/graph/package.json
packages/reputation/package.json
packages/search/package.json
packages/ui/package.json
packages/community-sdk/package.json
scripts/verify-workspace-dist.mjs
.github/workflows/runtime-validation.yml
.github/workflows/build.yml
reports/*.md (10 audit reports)
R1_RUNTIME_RECOVERY_REPORT.md
```

---

## VERIFICATION

| Check | Result |
|-------|--------|
| `require.resolve('@tsc/database')` from `apps/api` | OK (local, dist present) |
| `require('@tsc/database')` | OK |
| `pnpm build` (local Windows) | BLOCKED — prisma/fast-check EPERM (documented) |
| `pnpm verify:dist` (local) | OK when prior dist exists |
| Website `@clerk/nextjs` | Already installed |
| turbo `dependsOn: ^build` | Verified |
| nixpacks `pnpm build` | Verified (not reverted) |

---

## DEPLOYMENT STATUS

- Code fixes committed and pushed (see commit hash below)
- **Railway redeploy required** — trigger manual deploy or push to connected branch
- Founder env still required: `DATABASE_URL`, `REDIS_URL`, Clerk, `SENTRY_DSN`

### Post-deploy checks

```
GET /api/health/live   → 200
GET /api/health/ready  → 200 (with DB + Redis)
```

---

## NEXT ACTIONS

1. Confirm Railway service root = monorepo root (not `apps/api`)
2. Redeploy and watch build logs for `verify:dist OK`
3. Enable `runtime-validation` GitHub check on `main`
4. Founder: complete [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md) if not done

---

## GATE

**READY_FOR_DEPLOYMENT** — module resolution fix complete; awaiting Railway redeploy + founder secrets for full readiness health.

---

## Report index

| Agent | Report |
|-------|--------|
| Lead Architect | [runtime-architecture.md](reports/runtime-architecture.md) |
| Package Resolution | [package-resolution.md](reports/package-resolution.md) |
| Turborepo | [turbo-build-audit.md](reports/turbo-build-audit.md) |
| Railway | [railway-runtime-fix.md](reports/railway-runtime-fix.md) |
| NestJS Runtime | [runtime-startup-audit.md](reports/runtime-startup-audit.md) |
| Database | [database-package-audit.md](reports/database-package-audit.md) |
| Website | [website-build-fix.md](reports/website-build-fix.md) |
| CI/CD | [cicd-hardening.md](reports/cicd-hardening.md) |
| Local Dev | [local-dev-recovery.md](reports/local-dev-recovery.md) |
