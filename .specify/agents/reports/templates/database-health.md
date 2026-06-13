# Database Health Report

**Agent:** Database Agent  
**Layer:** Platform  
**Generated:** {{DATE}}

---

## Executive summary

---

## Schema validation

| Check | Result |
|-------|--------|
| `pnpm db:validate` | |
| Model count | ~95 expected |
| `pnpm db:generate` | |

---

## Migration status

| Check | Result |
|-------|--------|
| `prisma migrate status` | |
| Migrations in `prisma/migrations/` | MISSING if empty |
| Current mode | `db:push` only |

---

## Barrel export gaps

| File | Exported in `index.ts`? |
|------|-------------------------|
| `packages/database/src/agents.ts` | |
| Other domain files | |

---

## Index & FK health

| Table / model | Missing index? | FK integrity |
|---------------|----------------|--------------|
| | | |

---

## Unused / orphaned tables

| Model | Referenced by API module? | Action |
|-------|---------------------------|--------|
| | | |

---

## Slow queries (if available)

| Query | Duration | Recommendation |
|-------|----------|----------------|
| | | |

---

<!-- Include _master-status-section.md content below -->
