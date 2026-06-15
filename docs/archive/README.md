# docs/archive — Superseded Documentation

> Historical migration and audit docs. **Do not use as canonical architecture.**

## Why archived

The production architecture transformation (2026-06-15) established [../architecture/MASTER-PRODUCTION-ARCHITECTURE.md](../architecture/MASTER-PRODUCTION-ARCHITECTURE.md) as the single source of truth. Material in `docs/migration/` remains for **ETL and cutover execution** but defers to `docs/architecture/` for topology, deploy, and ownership decisions.

## What stays active (not moved)

| Path | Role |
|------|------|
| `docs/architecture/` | **Canonical** production architecture |
| `docs/SETUP.md`, `DEPLOYMENT.md`, `OPERATIONS.md`, `RUNBOOK.md` | Operational runbooks |
| `docs/migration/` | Mongo→Postgres ETL steps (execution detail) |
| `docs/FOUNDER-COREKNOT-LAUNCH.md` | Founder checklist (aligned with architecture) |
| `docs/coreknot-production-runbook.md` | CoreKnot ops (aligned) |
| `docs/coreknot-observability-setup.md` | Observability setup (aligned) |
| `docs/archive/render.coreknot.legacy.yaml` | Legacy Render blueprint (Railway is authority) |
| `docs/archive/SETUP-FOUNDER-RUNBOOK.md` | Historical founder runbook — use FOUNDER-TASKS |

## Superseded by architecture docs

| Old concept | Replacement |
|-------------|-------------|
| Multi-repo split (`tsc-api`, `tsc-web`, `tsc-community`) | [REPOSITORY-GOVERNANCE.md](../architecture/REPOSITORY-GOVERNANCE.md) — monorepo + 5-repo target |
| Render deploy for CoreKnot | [DEPLOYMENT-ARCHITECTURE.md](../architecture/DEPLOYMENT-ARCHITECTURE.md) — Railway |
| Root `SETUP-FOUNDER-RUNBOOK.md` | [FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) + [SETUP.md](../SETUP.md) |
| `.specify/architecture/system-overview.md` stale diagrams | [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) |
| Phase R0 sprint as active gate | [production-architecture.mdc](../../.cursor/rules/production-architecture.mdc) |
| Ad-hoc env matrix only | [ENV-STANDARD.md](../architecture/ENV-STANDARD.md) |

## Migration folder status

`docs/migration/*` is **historical execution detail** for Mongo→Postgres. Still useful for:

- ETL scripts (`scripts/migrations/coreknot/`)
- Count parity and cutover checklists
- Schema mapping audits

When Mongo is fully deprovisioned, move entire `docs/migration/` here with a dated README.

## Agent reports

`.agents/reports/` (gitignored) — never canonical. Use [TECH-DEBT-ROADMAP.md](../architecture/TECH-DEBT-ROADMAP.md).
