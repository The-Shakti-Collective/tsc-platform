# CoreKnot Mongo → Postgres ETL (P0)

Agent 3 — Data Migration Engineer. Idempotent extract / transform / load scripts for Wave 1 P0 entities.

**Mapping source:** [`docs/migration/02-schema-mapping.md`](../../../docs/migration/02-schema-mapping.md)  
**Audit source:** [`docs/migration/01-system-audit.md`](../../../docs/migration/01-system-audit.md)

## Prerequisites

| Env | File | Required | Notes |
|-----|------|----------|-------|
| `MONGODB_URI` | `apps/coreknot/server/.env` | Yes (export) | Legacy CoreKnot / Taskmaster Atlas. **Never commit.** Fallback: `MONGODB_URI_PROD` in same file |
| `DATABASE_URL` | repo root `.env` | Yes (seed / load) | Neon / local Postgres with Prisma schema applied (`pnpm db:push`) |
| `MONGODB_DB` | server `.env` | No | Default `taskmaster_production` |
| `MIGRATION_BATCH_SIZE` | either | No | Default `100` |
| `MIGRATION_FORCE_UPDATE` | either | No | Set to `1` to re-apply transforms on already-mapped rows |

### Env load order (all `scripts/migrations/coreknot/*` scripts)

Auto-loaded by `lib/load-migration-env.mjs` on import:

1. `apps/coreknot/server/.env` — fills unset keys
2. repo root `.env` — fills unset keys
3. root `.env` **overrides** `DATABASE_URL` (Postgres target)
4. server `.env` **overrides** `MONGODB_*` (Mongo source)
5. Shell exports always win

```powershell
pnpm install
pnpm db:generate   # see Windows EPERM note below
pnpm db:push       # applies ck_legacy_* tables to Neon
```

### Windows: Prisma `EPERM` on `query_engine-windows.dll.node`

`pnpm db:generate` / `pnpm db:push` may fail with `EPERM: operation not permitted, rename ... query_engine-windows.dll.node` when another process holds the Prisma engine DLL (CoreKnot CRM `:5000`, Nest API `:4000`, other Node/Prisma apps).

**Fix:** stop those processes, then retry:

```powershell
pnpm db:generate
# or db:push only — schema sync may succeed even if engine rename fails; retry generate after closing locks
```

`db:push` reporting "Your database is now in sync" means Neon schema is OK even if the EPERM appears afterward.

## Run order (P0)

FK dependencies require this sequence:

```text
1. organizations   (tenants → Organization)
2. users           (Person + User + Identity + OrganizationMember)
3. artists
4. leads
5. projects        (also creates Workspace rows from registry + project labels)
6. tasks           (Task + TaskAssignee)
7. inquiries
8. gigs
```

### Orchestrator (recommended)

```powershell
# Dry run (default) — counts only, no writes
$env:MONGODB_URI="mongodb+srv://..."
$env:DATABASE_URL="postgresql://..."
node scripts/migrations/coreknot/run-p0.mjs

# Execute writes
node scripts/migrations/coreknot/run-p0.mjs --execute

# Subset
node scripts/migrations/coreknot/run-p0.mjs --execute --only=organizations,users
```

### Per-entity pipeline

Each entity has three scripts:

| Step | Pattern | Example |
|------|---------|---------|
| Extract | `extract-<entity>.mjs` | Mongo read |
| Transform | `transform-<entity>.mjs` | Pure mapping (no I/O) |
| Load | `load-<entity>.mjs` | Prisma write + `SyncMapping` |

```powershell
node scripts/migrations/coreknot/load-organizations.mjs --execute
```

Load scripts run the full ETL chain. Extract/transform can be run alone for inspection (stdout JSON).

## Idempotency & restart safety

- Every migrated row writes **`SyncMapping`** (`sourceSystem: coreknot`, `eventType: migration_v1`).
- Unique key: `(sourceSystem, externalId, tscEntityType)`.
- Re-run skips rows with existing mappings unless `MIGRATION_FORCE_UPDATE=1`.
- Per-entity loads use Prisma **`$transaction`** where multiple tables are touched (users, tasks).
- Mongo `ObjectId` strings are stored in `externalId`; new TSC ids are `cuid()` from Prisma.

### FK resolution

Downstream scripts resolve legacy refs via `SyncMapping`:

```text
tenantId     → Organization
users._id    → Person (staff)
artistId     → Artist
projectId    → Project
assignedRepId → Person
```

## SyncMapping contract

```json
{
  "sourceSystem": "coreknot",
  "externalId": "<mongo ObjectId hex>",
  "tscEntityType": "Lead",
  "tscEntityId": "<new cuid>",
  "eventType": "migration_v1",
  "metadata": { "collection": "leads", "tenantId": "..." }
}
```

Entity types used in P0: `Organization`, `Person`, `User`, `Workspace`, `Project`, `Task`, `Artist`, `Lead`, `Inquiry`, `Gig`.

## Known cutover gaps

| Gap | Mitigation |
|-----|------------|
| **Clerk auth** | `User.clerkUserId` = `coreknot_pending_<mongoId>` until Clerk bulk import (Founder task H1) |
| **Passwords** | Not migrated — users re-auth via Clerk |
| **CRM Person graph** | `leads.personId` stored in `Lead.metadata` until schema FK added |
| **Workspace triple naming** | Registry + `project.workspace` labels merged in `load-projects` |

## Rollback notes

**There is no automatic rollback script.** Migrations are append-only with mapping ledger.

### Safe partial rollback (pre-cutover)

1. **Stop** — do not run with `--execute` on production until verified on staging.
2. **Identify scope** — query Postgres:
   ```sql
   SELECT "tscEntityType", COUNT(*) FROM "SyncMapping"
   WHERE "sourceSystem" = 'coreknot' AND "eventType" = 'migration_v1'
   GROUP BY 1;
   ```
3. **Delete in reverse FK order** (children first):
   ```text
   Gig → Inquiry → TaskAssignee → Task → ProjectMember → Project
   → WorkspaceMember → Workspace → Lead → Artist → OrganizationMember
   → User → Identity → Person → Organization → SyncMapping
   ```
4. **Delete mappings last** (or per-entity):
   ```sql
   DELETE FROM "SyncMapping"
   WHERE "sourceSystem" = 'coreknot' AND "eventType" = 'migration_v1'
     AND "tscEntityType" = 'Lead';
   ```
5. **Clerk placeholders** — remove `User` rows with `clerkUserId LIKE 'coreknot_pending_%'` before re-import.

### Post-cutover

Prefer **forward fix** (re-run with `MIGRATION_FORCE_UPDATE=1`) over delete. Full restore = Neon point-in-time recovery + re-run ETL.

## Verification

After `--execute`:

```sql
-- Mapping coverage
SELECT "tscEntityType", COUNT(*) FROM "SyncMapping"
WHERE "sourceSystem" = 'coreknot' GROUP BY 1;

-- Orphan checks (should be 0)
SELECT COUNT(*) FROM "Lead" l
LEFT JOIN "Organization" o ON o.id = l."organizationId"
WHERE o.id IS NULL;
```

Compare Mongo collection counts vs `SyncMapping` counts per entity.

## File layout

```text
scripts/migrations/coreknot/
  lib/                  shared env, mongo, prisma, sync-mapping, maps
  extract-*.mjs
  transform-*.mjs
  load-*.mjs
  run-p0.mjs            orchestrator
  package.json          @tsc/coreknot-migrations (mongodb + @tsc/database)
```

## Related

- Legacy monolith script (superseded for P0): `scripts/coreknot/migrate-mongo-to-tsc.mjs`
- Prisma target: `packages/database/prisma/schema.prisma`
- **Local auth seed (pilot):**
  ```powershell
  # 1. MONGODB_URI in apps/coreknot/server/.env
  # 2. DATABASE_URL in repo root .env
  pnpm coreknot:migrate:export-users   # → scripts/migrations/coreknot/out/users-export.json
  pnpm coreknot:migrate:seed-auth      # → ck_legacy_* tables on Neon
  # 3. COREKNOT_AUTH_STORE=postgres in apps/coreknot/server/.env
  ```
- Full plan: `.specify/migrations/coreknot-mongo-to-postgres.md`
