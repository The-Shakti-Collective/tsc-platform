# CI/CD Standard

> GitHub Actions on `TheShaktiCollective/tsc-platform`. Node 22, pnpm 9.15, Turbo.

## Workflow inventory

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push/PR `main`, `develop` | **Canonical** — lint, typecheck, test, build |
| `ci-api.yml` | path filter | API-specific |
| `ci-community.yml` | path filter | Community |
| `ci-website.yml` | path filter | Website |
| `ci-coreknot-client.yml` | path filter | CoreKnot client |
| `ci-packages.yml` | path filter | Packages |
| `security.yml` | schedule/PR | Dependency audit |
| `runtime-validation.yml` | manual/schedule | Runtime smoke incl. Mongo migration checks |

**Status (2026-06-15):** Legacy split workflows (`lint.yml`, `typecheck.yml`, `test.yml`, `build.yml`) removed — see [elimination/CI-CD-CERTIFICATE.md](../elimination/CI-CD-CERTIFICATE.md).

## Primary CI job (`ci.yml`)

```yaml
env:
  NODE_VERSION: "22"
  PNPM_VERSION: "9.15.0"
  DATABASE_URL: postgresql://tsc:tsc@localhost:5432/tsc_ci
  TSC_AUTH_STUB: "true"
  NEXT_PUBLIC_AUTH_STUB: "true"
  CLERK_SECRET_KEY: sk_test_ci_placeholder
```

Steps: checkout → setup-pnpm → `pnpm db:generate` → lint → typecheck → test → build

## Package scripts

| Script | CI step |
|--------|---------|
| `pnpm ci` | lint + typecheck + test + build (Turbo) |
| `pnpm lint` | ESLint all workspaces |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests per package |
| `pnpm build` | `@tsc/api...` build chain |
| `pnpm db:generate` | Prisma client generation |

## CoreKnot CI gap

CoreKnot **server** (Express/Mongo) is not in main `ci.yml` Turbo build filter. Workflows:

- `ci-coreknot-client.yml` — client only
- `runtime-validation.yml` — migration/runtime checks

**Action:** Add `apps/coreknot/server` test job (`pnpm --filter @tsc/coreknot-server test`) to CI when Mongo stub available.

## Deploy pipelines (target)

| Event | Action | Host |
|-------|--------|------|
| merge to `main` | Railway auto-deploy | Platform API, CoreKnot |
| merge to `main` | Vercel auto-deploy | Website, Community, CoreKnot client |
| tag `v*` | Optional manual promote | Production |

Deploy secrets in GitHub org — not in repo:

- `RAILWAY_TOKEN` (if using CLI deploy)
- `VERCEL_TOKEN`
- `TURBO_TOKEN`, `TURBO_TEAM`

## Branch strategy

- `main` — production-ready
- `develop` — integration (optional)
- Feature branches → PR → `main`
- See `org-scaffold/tsc-infra/docs/branch-strategy.md`

## Quality gates (required before prod)

| Gate | Command | Status |
|------|---------|--------|
| Typecheck zero errors | `pnpm typecheck` | ✅ Passing (R0) |
| Lint | `pnpm lint` | ⚠️ Debt noted in founder tasks |
| Unit tests | `pnpm test` | Partial |
| E2E | `pnpm test:e2e` | ❌ 5/8 failing (readiness audit) |
| OpenAPI export | `pnpm openapi:export` | Available |
| Migration parity | `pnpm migrate:coreknot:count-parity` | Manual |
| Prod sweep | `pnpm sweep:prod` | Requires live URLs |

## OpenAPI / contracts

Export Platform API spec:

```bash
pnpm openapi:export
# → apps/api/openapi/tsc-api.openapi.json
```

Copy to `tsc-docs` repo on release. Contract validation in `runtime-validation.yml`.

## org-scaffold CI templates

`org-scaffold/*/.github/workflows/` — templates for **extracted repos**, not active in monorepo. On extraction:

- Copy relevant workflow to target repo
- Update paths and filters

## Recommendations

1. Add CI service container for Postgres (replace placeholder `DATABASE_URL` with ephemeral PG)
2. Add Redis service container for queue tests
3. Block merge on `ci.yml` + security audit
4. Add deploy workflow with manual approval for Railway production
5. ~~Remove duplicate split workflows~~ ✅ Done — update GitHub branch protection to require `CI` job
