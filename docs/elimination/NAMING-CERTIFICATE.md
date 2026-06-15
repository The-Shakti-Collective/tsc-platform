# Naming Certificate (Agent 03)

> **Date:** 2026-06-15  
> **Standard:** [../architecture/NAMING-CONVENTIONS.md](../architecture/NAMING-CONVENTIONS.md)

## Before state

| Area | Legacy name | Issue |
|------|-------------|-------|
| Standalone repos | `tsc-api`, `tsc-community`, `tsc-web` | Deprecated but referenced in deploy docs |
| Vercel projects | `tsc-community`, `tsc-website` | OK as **project names**; not repo names |
| Railway service | `tsc-api` in FOUNDER-TASKS | Should be `tsc-platform-api` |
| OpenAPI artifact | `tsc-api.openapi.json` | Filename retained (stable contract); not a repo |
| Package name | `@tsc/api` | Correct scoped name |
| Monorepo | `tsc-platform` | Correct |
| Env prefix | `TSC_*`, `NEXT_PUBLIC_*`, `COREKNOT_*` | Aligned in ENV-STANDARD |

## After state (fixes applied)

| Location | Change |
|----------|--------|
| `docs/DEPLOYMENT.md` | Community domain clarified: path-based `/community` on apex |
| `org-scaffold/tsc-api`, `tsc-community`, `tsc-web` | `DEPRECATED.md` — do not create repos |
| Root `package.json` | Added `openapi:export` alias → `@tsc/api` |
| `docs/elimination/*` | Consistent **Platform API** / **TSC Website** / **TSC Community** product names |

## Naming matrix (certified)

| Product | Code path | Package | Deploy host | Domain |
|---------|-----------|---------|-------------|--------|
| Platform API | `apps/api` | `@tsc/api` | Railway | `api.theshakticollective.in` |
| TSC Website | `apps/website` | `@tsc/website` | Vercel | `theshakticollective.in` |
| TSC Community | `apps/community` | `@tsc/community` | Vercel | `theshakticollective.in/community` |
| CoreKnot client | `apps/coreknot/client` | `@tsc/coreknot-client` | Vercel | `coreknot.in` |
| CoreKnot API | `apps/coreknot/server` | `@tsc/coreknot-server` | Railway | `api.coreknot.in` |

## Reject list (do not introduce)

- New repos named `tsc-api`, `tsc-community`, `tsc-web`
- Deploy from `org-scaffold/` paths
- Render service names for new CoreKnot deploys

## Risk

Low — documentation and alias only. OpenAPI filename unchanged to avoid breaking CI/export paths.

## Rollback

Revert doc edits and remove `openapi:export` root script alias.
