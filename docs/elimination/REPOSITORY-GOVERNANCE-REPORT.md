# Repository Governance Report (Agent 02)

> **Date:** 2026-06-15  
> **Authority:** [../architecture/REPOSITORY-GOVERNANCE.md](../architecture/REPOSITORY-GOVERNANCE.md)

## Before state

| Repo | Documented status | Problem |
|------|-------------------|---------|
| `tsc-platform` | Primary monorepo | ✅ Correct |
| `tsc-coreknot` | Extract target | Still in `apps/coreknot/` |
| `tsc-shared`, `tsc-infra`, `tsc-docs` | KEEP | Scaffolds in `org-scaffold/` |
| `tsc-api`, `tsc-community`, `tsc-web` | DEPRECATE | 40+ doc references; `org-scaffold/` folders still present |
| GitHub org naming | Mixed `The-Shakti-Collective` / `TheShaktiCollective` | Drift in `.agents/` and old scaffolds |

## After state

| Action | Result |
|--------|--------|
| `org-scaffold/README.md` | Already marked historical — retained |
| Deprecated scaffold READMEs | Added `DEPRECATED.md` stubs in `tsc-api/`, `tsc-community/`, `tsc-web/` |
| Root `README.md` | Points to REPOSITORY-GOVERNANCE — unchanged, verified |
| `docs/elimination/` | This report + index for agent continuity |
| `SETUP-FOUNDER-RUNBOOK.md` | Moved to `docs/archive/` (superseded by FOUNDER-TASKS + SETUP) |

## Target repo set (verified)

```
KEEP:     tsc-platform, tsc-coreknot, tsc-shared, tsc-infra, tsc-docs
DEPRECATE: tsc-api, tsc-community, tsc-web (archive GitHub repos when founder ready)
IN-MONOREPO: apps/api, apps/website, apps/community, apps/coreknot/*
```

## Vercel / Railway mapping (canonical)

| Deploy | Repo | Path |
|--------|------|------|
| Platform API | tsc-platform | repo root → `scripts/railway-start.mjs` |
| TSC Website | tsc-platform | `apps/website` |
| TSC Community | tsc-platform | `apps/community` |
| CoreKnot client | tsc-coreknot (future) / monorepo today | `apps/coreknot/client` |
| CoreKnot API + workers | tsc-coreknot (future) / monorepo today | `apps/coreknot/server` |

## Remaining gaps (founder / extraction)

1. Archive GitHub org repos `tsc-api`, `tsc-community`, `tsc-web` with README redirect
2. Extract `org-scaffold/tsc-infra` → `tsc-infra` repo
3. Extract `apps/coreknot/` → `tsc-coreknot` repo
4. Normalize org slug references in `.agents/` (out of Worker D scope)

## Risk

| Risk | Mitigation |
|------|------------|
| Vercel still linked to old repos | Founder: re-link projects to `tsc-platform` monorepo paths |
| Agents read `.agents/shakti-collective-org-setup.md` | Mark stale in DOCUMENTATION-CERTIFICATE; canonical = `docs/architecture/` |

## Rollback

- Restore `SETUP-FOUNDER-RUNBOOK.md` from `docs/archive/` if needed
- Revert `DEPRECATED.md` stubs — no runtime impact
