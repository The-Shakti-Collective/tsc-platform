# Documentation Certificate (Agent 16)

> **Date:** 2026-06-15

## Before state

| Issue | Location |
|-------|----------|
| No elimination program index | — |
| Duplicate CI/deploy guidance | `docs/readiness/` vs `docs/architecture/` |
| Root `SETUP-FOUNDER-RUNBOOK.md` | Overlaps FOUNDER-TASKS + SETUP.md |
| Legacy Render config in repo root of CoreKnot | `apps/coreknot/render.yaml` |
| `docs/archive/README.md` | Good — but missing new archives |
| Architecture index | Missing elimination link |

## After state

| Action | Result |
|--------|--------|
| Created `docs/elimination/` | 8 agent reports + README index |
| Updated `docs/architecture/README.md` | Link to elimination program |
| Updated `docs/archive/README.md` | Render legacy + founder runbook entries |
| Moved `SETUP-FOUNDER-RUNBOOK.md` | → `docs/archive/SETUP-FOUNDER-RUNBOOK.md` |
| Updated `docs/DEPLOYMENT.md` | Render → archive path; openapi alias |
| Updated `docs/SETUP.md` | Link to elimination index |
| Updated `docs/RUNBOOK.md` | Link to observability plan |
| Updated `docs/architecture/CI-CD-STANDARD.md` | Consolidated workflow list |
| Updated `docs/architecture/TECH-DEBT-ROADMAP.md` | M1, H6, H7 partial close |

## Document hierarchy (certified)

```
docs/
├── architecture/          ← CANONICAL production architecture
├── elimination/           ← Tech debt elimination certificates (this wave)
├── SETUP.md, DEPLOYMENT.md, RUNBOOK.md, OPERATIONS.md  ← Ops entry
├── FOUNDER-COREKNOT-LAUNCH.md
├── coreknot-*.md          ← CoreKnot ops (aligned)
├── migration/             ← ETL execution (historical detail)
├── readiness/             ← Pre-production audit (2026-06-15) — reference only
└── archive/               ← Superseded docs + legacy configs
```

## Docs cleaned / reorganized

| Count | Item |
|-------|------|
| 9 | New files in `docs/elimination/` |
| 1 | Archived `SETUP-FOUNDER-RUNBOOK.md` |
| 1 | Archived `render.coreknot.legacy.yaml` |
| 8 | Updated cross-links in SETUP, DEPLOYMENT, RUNBOOK, architecture index, TECH-DEBT, CI-CD-STANDARD, archive README |
| 3 | `DEPRECATED.md` stubs in org-scaffold |

## Still active (not archived)

- `docs/migration/*` — needed for Mongo cutover
- `docs/readiness/*` — audit trail; superseded by elimination certs for ongoing work
- `docs/coreknot-production-runbook.md` — operational

## Risk

| Risk | Mitigation |
|------|------------|
| Broken links to `SETUP-FOUNDER-RUNBOOK.md` | Grep + redirect note in archive README |
| Agents use `.specify/` stale diagrams | TECH-DEBT M7 remains open |

## Rollback

```powershell
git checkout HEAD~1 -- docs/ SETUP-FOUNDER-RUNBOOK.md
```
