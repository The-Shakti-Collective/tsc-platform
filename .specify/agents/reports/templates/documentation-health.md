# Documentation Health Report

**Agent:** Documentation Agent  
**Layer:** Operations  
**Generated:** {{DATE}}

---

## Executive summary

---

## Core documentation

| Doc | Path | Fresh | Conflicts |
|-----|------|-------|-----------|
| Master index | `.specify/MASTER.md` | | |
| System overview | `.specify/architecture/system-overview.md` | | |
| STARTUP | `STARTUP.md` | | Render vs Railway |
| AGENTS | `AGENTS.md` | | |
| Known gaps | `.specify/decisions/known-gaps.md` | | |
| CI/CD | `.specify/operations/ci-cd.md` | | Root workflows exist |

---

## App documentation

| App | Spec doc | README | API docs |
|-----|----------|--------|----------|
| API | `.specify/apps/api.md` | | OpenAPI MISSING |
| Community | `.specify/apps/community.md` | | |
| CoreKnot | `.specify/apps/coreknot.md` | | |

---

## Missing / outdated

| Item | Expected location | Status |
|------|-------------------|--------|
| Global `/api/health` doc | health-checks.md | Drift vs code |
| ERD diagrams | `.specify/architecture/` | MISSING |
| CONTEXT.md | repo root | MISSING |
| OpenAPI spec | org-scaffold/tsc-docs | Stub only |

---

## Doc conflict register

| Topic | File A | File B | Canonical |
|-------|--------|--------|-----------|
| | | | |

---

<!-- Include _master-status-section.md content below -->
