# Shared Package Roadmap (Agent 07)

> **Date:** 2026-06-15  
> **Constitution:** [../architecture/DATA-OWNERSHIP-MAP.md](../architecture/DATA-OWNERSHIP-MAP.md), [../architecture/MONOREPO-STANDARD.md](../architecture/MONOREPO-STANDARD.md)

## Before state

| Package | Consumers (runtime) | Classification |
|---------|---------------------|----------------|
| `@tsc/constants` | API, Community, Website | Shared foundation |
| `@tsc/types` | API, Community, contracts | Shared foundation |
| `@tsc/contracts` | API, Community, domain packages | Shared foundation |
| `@tsc/database` | API, CoreKnot server, migrations | Shared (single Neon schema) |
| `@tsc/permissions` | API, Community | Shared (RBAC) |
| `@tsc/community-sdk` | Community | Platform |
| `@tsc/analytics` | API (agents, intelligence, trust) | Platform intelligence |
| `@tsc/projects` | **None in `apps/api/src`** — package.json only | Orphan dep |
| `@tsc/tasks` | **None in `apps/api/src`** — package.json only | Orphan dep |
| `@tsc/workspace` | **None in `apps/api/src`** — package.json only | Orphan dep |
| `@tsc/graph` | **Zero imports** — re-exports `@tsc/database` | Delete candidate |
| `@tsc/reputation` | **Zero imports** — re-exports analytics/database | Delete candidate |
| `@tsc/search` | **Zero imports** — placeholder stub | Keep stub until Typesense |
| `@tsc/ui` | **Zero imports** — placeholder stub | Keep stub until design system |

## After state

| Action | Result |
|--------|--------|
| Package audit complete | All 15 `packages/*` classified below |
| Safe deletions | **None this wave** — graph/reputation are thin re-exports; removal breaks deploy bundle verify script |
| Re-exports documented | `@tsc/graph`, `@tsc/reputation` marked **DEPRECATE → merge into `@tsc/database` / `@tsc/analytics`** |

## Classification matrix

| Package | Verdict | Target repo / phase |
|---------|---------|---------------------|
| `@tsc/constants` | **Stay Shared** | `tsc-shared` Q1 2027 |
| `@tsc/types` | **Stay Shared** | `tsc-shared` |
| `@tsc/contracts` | **Stay Shared** | `tsc-shared` |
| `@tsc/database` | **Stay Shared** | `tsc-shared` (schema owner) |
| `@tsc/permissions` | **Stay Shared** | `tsc-shared` |
| `@tsc/community-sdk` | **Stay Platform** | Monorepo until Community stabilizes |
| `@tsc/analytics` | **Stay Platform** | Intelligence layer |
| `@tsc/projects` | **Move to CoreKnot** | Extract with CoreKnot API (M5) |
| `@tsc/tasks` | **Move to CoreKnot** | Extract with CoreKnot API |
| `@tsc/workspace` | **Move to CoreKnot** | Extract with CoreKnot API |
| `@tsc/graph` | **Delete** (after re-export consumers → database) | Phase 2 |
| `@tsc/reputation` | **Delete** (after trust module imports analytics directly) | Phase 2 |
| `@tsc/search` | **Stay Platform** | Wire Typesense in FOUNDER-TASKS step 7 |
| `@tsc/ui` | **Stay Platform** | shadcn extraction when Website+Community share components |

## Dependency hygiene (next PR)

Remove unused workspace deps from `apps/api/package.json`:

```json
"@tsc/projects": "workspace:*",  // remove — logic in apps/api modules + @tsc/database
"@tsc/tasks": "workspace:*",     // remove
"@tsc/workspace": "workspace:*"  // remove
```

Update `scripts/verify-deploy-bundle.mjs` accordingly after removal.

## Risk

| Risk | Mitigation |
|------|------------|
| Premature delete of graph/reputation | Zero runtime imports confirmed; keep until deploy script updated |
| CoreKnot packages moved before Mongo sunset | Keep in monorepo until `tsc-coreknot` repo cutover (Q4 2026) |
| Duplicate `@tsc/constants` in `org-scaffold/tsc-shared` | Archive org-scaffold per Worker D |

## Rollback

- Re-add any removed `package.json` workspace dependency
- Restore deleted package directory from git history
- No runtime behavior change from this audit-only wave (except documented roadmap)

## Milestones

| Phase | Action |
|-------|--------|
| **Now** | Document classifications (this file) |
| **P1** | Remove orphan API deps; add `@deprecated` JSDoc to graph/reputation |
| **Q3 2026** | CoreKnot Clerk live → move projects/tasks/workspace to CoreKnot tree |
| **Q1 2027** | Publish `@tsc/shared` meta-package from constants/types/contracts/database/permissions |
