# 13 — Database Health

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Order** | 13 of 15 |

## Mission

Harden database layer: migration history, barrel exports, index audit, orphan checks — beyond daily Database agent sweep.

## Input

- `packages/database/prisma/schema.prisma` (95 models)
- 1 migration applied; `db:push` vs migrate drift
- Missing `agents.ts` barrel export

## Tasks

1. Validate schema: `pnpm db:validate` and `pnpm db:generate`.
2. Reconcile migration strategy — formalize `migrate dev` workflow vs push.
3. Complete barrel exports in `packages/database/src/index.ts` (include `agents.ts`).
4. Audit FK columns for missing indexes in schema.
5. Run orphan relationship queries (graph types) via Prisma Studio or SQL.
6. Flag unused models with no API module reference.
7. Document Neon branch strategy for dev vs prod.

## Verification commands

```powershell
pnpm db:validate
pnpm db:generate
pnpm --filter @tsc/database exec prisma migrate status
pnpm db:studio
rg "from './agents'" packages/database/src
pnpm --filter @tsc/database build
```

## Deliverable path

`.agents/reports/execution/13-database-health.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Schema valid | `pnpm db:validate` exit 0 |
| Migrations | Status documented; drift resolved or planned |
| Barrel complete | `agents.ts` and other domains exported |
| Index audit | Top FK gaps listed with fix PRs |
| Orphans | Sample query run; count in report |
