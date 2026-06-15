# Dead Code Elimination Report (Agent 17)

> **Date:** 2026-06-15  
> **Scope:** Docs, configs, org-scaffold, CI — **not** business modules (other workers)

## Before state

| Artifact | Classification | Lines / files |
|----------|----------------|---------------|
| `.github/workflows/lint.yml` | Duplicate CI | 38 |
| `.github/workflows/typecheck.yml` | Duplicate CI | 38 |
| `.github/workflows/test.yml` | Duplicate CI | 51 |
| `.github/workflows/build.yml` | Duplicate CI | 60 |
| `apps/coreknot/render.yaml` | Legacy deploy | 70 |
| `org-scaffold/tsc-api/` | Deprecated scaffold | 52 files subtree |
| `org-scaffold/tsc-community/` | Deprecated scaffold | partial |
| `org-scaffold/tsc-web/` | Deprecated scaffold | partial |
| `org-scaffold/tsc-docs/openapi/tsc-api.openapi.json` | Stale copy of spec | duplicate |
| Root `openapi:export` script | Missing alias | docs referenced nonexistent command |

## Removed (safe)

| Item | Reason |
|------|--------|
| `lint.yml`, `typecheck.yml`, `test.yml`, `build.yml` | Superseded by `ci.yml` |
| `apps/coreknot/render.yaml` | Archived — Railway is deploy authority |

## Marked deprecated (not deleted — rollback friendly)

| Path | Action |
|------|--------|
| `org-scaffold/tsc-api/DEPRECATED.md` | Pointer to `apps/api` |
| `org-scaffold/tsc-community/DEPRECATED.md` | Pointer to `apps/community` |
| `org-scaffold/tsc-web/DEPRECATED.md` | Pointer to `apps/website` |

## Not removed (out of scope / risk)

| Artifact | Reason |
|----------|--------|
| `apps/api/src/modules/coreknot-compat/` | Runtime — Worker A/B |
| `legacy-jwt.service.ts` | Auth cutover pending |
| `scripts/migrations/coreknot/` | Active ETL |
| `.agents/*` stale org docs | Not in Worker D scope |
| Full `org-scaffold/` tree | tsc-infra/shared/docs still needed for extraction |

## Added

| Item | Purpose |
|------|---------|
| `openapi:export` root script | Doc/CI parity |
| `apps/api/src/observability/README.md` | Scaffold documentation |
| `docs/archive/render.coreknot.legacy.yaml` | Render rollback reference |

## Env vars audited (unused / legacy names)

| Var | Status |
|-----|--------|
| `POSTHOG_PROJECT_TOKEN` vs `POSTHOG_API_KEY` | Both in API example — document either works (P1 consolidate) |
| `.env.render.example` (CoreKnot) | Legacy — add DEPRECATED comment in file header |
| `RENDER_*` | No active deploy — safe to ignore |

## Summary counts

| Metric | Count |
|--------|-------|
| CI workflows deleted | 4 |
| Deploy configs archived | 1 |
| DEPRECATED stubs added | 3 |
| Scaffold README added | 1 (observability) |
| Root scripts added | 1 (`openapi:export`) |

## Risk

| Risk | Mitigation |
|------|------------|
| GitHub branch protection expects old check names | Update to `CI` workflow |
| Someone deploys from Render archive | File marked LEGACY; DEPLOYMENT.md says Railway only |

## Rollback

```powershell
git checkout HEAD~1 -- .github/workflows/ apps/coreknot/render.yaml
# Restore render from docs/archive/render.coreknot.legacy.yaml if needed
```
