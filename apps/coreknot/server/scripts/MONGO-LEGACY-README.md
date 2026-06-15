# Mongo legacy scripts index

> **Status:** ARCHIVE candidates — not runtime. Remove after [MONGO-ERADICATION-PLAN.md](../../../../docs/elimination/MONGO-ERADICATION-PLAN.md) exit criteria.

## Root-level orphans (`server/*.js`)

One-off migrations and debug scripts outside `scripts/`. Do not run in production.

| File | Purpose |
|------|---------|
| `migrate_attendance.js` | Flat timeIn/timeOut → sub-document schema |
| `migrateTasks.js` | assignees[] → TaskAssignment collection |
| `migrateArtists.js` | Artist collection migration |
| `get_projects.js` | Project dump utility |
| `query_tech.js` | Ad-hoc Mongo query |
| `scan_basecamp.js` | Basecamp import probe |
| `test_aisensy.js` | AiSensy manual test |
| `test-mailer.js` | Mailer manual test |

## `scripts/` directory

**117 files** reference mongoose/mongodb. Categories:

- **ETL/sync:** `syncProdToLocal.js`, `sync-*-to-prod.js`
- **Backfill:** `backfill*.js`
- **QA/audit:** `qa*.js`, `audit*.js`, `runQAScan.js`
- **Seed:** `seed*.js` (keep `seedE2eUsers.js` until Postgres seed replaces)
- **Migrate:** `migrate-*.js`, `migrate*.js`
- **Ops:** `atlasStorageCleanup.js`, `ensureIndexes.js`

## ETL (canonical migration path)

Use `scripts/migrations/coreknot/` at repo root — not these one-offs.

```bash
pnpm migrate:coreknot:p0:execute
pnpm migrate:coreknot:count-parity
```
