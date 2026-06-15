# CI/CD Certificate (Agent 12)

> **Date:** 2026-06-15  
> **Standard:** [../architecture/CI-CD-STANDARD.md](../architecture/CI-CD-STANDARD.md)

## Before state

| Workflow | Trigger | Overlap |
|----------|---------|---------|
| `ci.yml` | push/PR main,develop | Full lint+typecheck+test+build |
| `lint.yml` | same | Duplicate lint only |
| `typecheck.yml` | same | Duplicate typecheck only |
| `test.yml` | same | Duplicate test only |
| `build.yml` | same | Duplicate build + deploy bundle |
| `ci-api.yml` | path-filtered API | Focused turbo filter ✅ |
| `ci-community.yml` | path-filtered | ✅ |
| `ci-website.yml` | path-filtered | ✅ |
| `ci-coreknot-client.yml` | path-filtered | ✅ |
| `ci-packages.yml` | path-filtered packages | ✅ |
| `security.yml` | `pnpm audit --audit-level=high` | ✅ |
| `runtime-validation.yml` | deploy bundle smoke | ✅ (partial overlap with build.yml) |

**Problem:** Every push ran **5 parallel CI pipelines** doing the same work (M1 in TECH-DEBT-ROADMAP).

## After state

| Action | Result |
|--------|--------|
| **Deleted** `lint.yml`, `typecheck.yml`, `test.yml`, `build.yml` | Single canonical `ci.yml` |
| **Kept** path-scoped workflows | Faster feedback on app changes |
| **Kept** `runtime-validation.yml` | Deploy artifact + cutover profile validation |
| **Kept** `security.yml` | Independent audit gate |
| Root `package.json` | `ci` / `ci:fallback` unchanged |

## Certified pipeline map

```
PR / push (main, develop)
├── ci.yml              → lint · typecheck · test · build (full monorepo)
├── ci-api.yml          → @tsc/api... (paths: apps/api, packages)
├── ci-community.yml    → @tsc/community
├── ci-website.yml      → @tsc/website
├── ci-coreknot-client  → CoreKnot client
├── ci-packages.yml     → shared packages
├── security.yml        → pnpm audit (high+)
└── runtime-validation  → deploy bundle + cutover dry-run
```

## CI env stubs (verified in ci.yml)

- `DATABASE_URL=postgresql://tsc:tsc@localhost:5432/tsc_ci`
- Clerk placeholders, `TSC_AUTH_STUB=true`, frontend API URLs

## Remaining gaps

| ID | Item | Owner |
|----|------|-------|
| M2 | CoreKnot **server** not in CI build | Add `ci-coreknot-server.yml` or extend runtime-validation |
| — | Deploy workflows (Railway/Vercel) | Founder tokens — not in repo |

## Risk

| Risk | Mitigation |
|------|------------|
| Branch protection required separate status checks named `lint`, `build` | Update GitHub branch rules to require `CI` job |
| Lost parallel fan-out for faster partial green | Path-scoped workflows retained |

## Rollback

Restore deleted workflows from git history:

```powershell
git checkout HEAD~1 -- .github/workflows/lint.yml typecheck.yml test.yml build.yml
```
