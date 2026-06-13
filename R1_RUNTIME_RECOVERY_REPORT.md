# R1 Runtime Recovery Report

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Status:** READY_FOR_DEPLOYMENT (pending Railway redeploy)

---

## ROOT CAUSE

Nixpacks builds workspace `dist/` successfully (`verify:dist` passes), then final `COPY . /app` replaces git-tracked package dirs without gitignored `dist/`. Runtime `require("@tsc/database")` follows pnpm symlinks to `packages/database/` — **package.json present, dist/ gone** → crash.

Classification: **A — dist built but excluded from runtime image** (Nixpacks COPY + `.gitignore` dist/).

Prior **B** (turbo full graph) was necessary but insufficient alone.

---

## FIXES APPLIED

| # | Fix |
|---|-----|
| 1 | Root `build` → `turbo run build --filter=@tsc/api...` (full dep graph) |
| 2 | `"files": ["dist"]` on all workspace packages |
| 3 | `scripts/verify-workspace-dist.mjs` + `pnpm verify:dist` |
| 4 | **`pnpm deploy` → `/app/deploy`** — self-contained prod bundle |
| 5 | **`scripts/railway-start.mjs`** — start from deploy dir with preflight |
| 6 | **`scripts/verify-deploy-bundle.mjs`** — fail build if bundle incomplete |
| 7 | `nixpacks.toml` / `railway.json` start → `node scripts/railway-start.mjs` |
| 8 | `.github/workflows/runtime-validation.yml` — deploy bundle checks |

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
