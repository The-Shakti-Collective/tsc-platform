# 02 — API Typecheck Elimination

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Order** | 2 of 15 |

## Mission

Reduce API TypeScript errors from ~317 to **zero** so CI, contracts, and runtime dev are unblocked.

## Input

- `apps/api/` source tree
- `pnpm --filter @tsc/api typecheck` output
- Related packages: `@tsc/database`, `@tsc/contracts`, `@tsc/permissions`

## Tasks

1. Baseline error count: `pnpm --filter @tsc/api typecheck 2>&1 | Select-String "error TS" | Measure-Object`.
2. Group errors by module under `apps/api/src/modules/` — fix highest-count modules first.
3. Fix Prisma/client type mismatches and missing barrel exports (e.g. `agents.ts`).
4. Resolve stub controller type gaps without weakening strict mode.
5. Re-run build after each batch: `pnpm --filter @tsc/api build`.
6. Track remaining count in deliverable; target 0 errors.
7. Verify workspace packages used by API still typecheck.

## Verification commands

```powershell
pnpm --filter @tsc/api typecheck
pnpm --filter @tsc/api build
pnpm --filter @tsc/database build
pnpm --filter @tsc/contracts build
rg "error TS" -g "*.log" .agents/reports/execution/ -ErrorAction SilentlyContinue
```

## Deliverable path

`.agents/reports/execution/02-typecheck-status.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Typecheck | `pnpm --filter @tsc/api typecheck` exit 0 |
| Build | `pnpm --filter @tsc/api build` exit 0 |
| Error trend | Deliverable shows baseline → final count |
| No `@ts-ignore` spam | Justified suppressions only, listed in report |
