# Migration reconciliation — Mongo vs Postgres

**Date:** 2026-06-14  
**Agent:** L7 — Database Reconciliation  
**Environment:** Local `DATABASE_URL` (Neon dev) + Mongo Atlas `taskmaster_production`  
**ETL:** `pnpm migrate:coreknot:p0:execute` (exit 0)  
**SyncMapping:** **2481** rows verified (`SELECT COUNT(*) FROM "SyncMapping"`)

**Scope:** Read-only reconciliation — **no production changes.**

**Sources:** [migration-counts-before.md](./migration-counts-before.md) · [migration-counts-after.md](./migration-counts-after.md) · [mongo-audit.md](./mongo-audit.md)

---

## Entity parity

| Entity | Mongo collection / source | Expected (Mongo) | PG model | Actual (PG) | Variance | Status |
|--------|---------------------------|-----------------:|----------|--------------:|---------:|--------|
| **Users** | `users` | 16 | `User` | 19 | +3 | ⚠️ Seed |
| **Artists** | `artists` | 4 | `Artist` | 4 | 0 | ✅ |
| **Projects** | `projects` | 34 | `Project` | 34 | 0 | ✅ |
| **Tasks** | `tasks` | 373 | `Task` | 371 | **−2** | ⚠️ Gap |
| **Contracts** | `artistcontracts` | 0 | `Contract` | 0 | 0 | ✅ |
| **Invoices** | `financedocuments` | 257 | `Invoice` | 0 | −257 | ⬜ Not P0 |
| **Files** | `financedocuments` (`fileUrl` / `fileKey`) | 257* | `ContentAsset` | 0 | −257* | ⬜ Not P0 |

\* **Files:** Mongo row count = `financedocuments` documents carrying file metadata (per [02-schema-mapping §5.7](./02-schema-mapping.md)). Binary objects live on UploadThing — not duplicated in Mongo document count. Separate attachment cardinality audit pending ([06-storage-migration](./06-storage-migration.md)).

### Users variance (+3)

Postgres total includes **3 pre-existing seed users** before execute. Migrated users match Mongo 1:1:

| Metric | Count |
|--------|------:|
| Mongo `users` | 16 |
| PG `User` (total) | 19 |
| PG `User` (migrated via SyncMapping) | 16 |
| SyncMapping `User` | 16 |

---

## Tasks — 2-document gap (373 vs 371)

| Source | Count |
|--------|------:|
| Mongo `tasks` (audit + ETL extract) | **373** |
| Postgres `Task` | **371** |
| SyncMapping `Task` | **371** |

**Variance:** −2 tasks not loaded into Postgres.

**Likely causes (investigate):**

1. **Orphan / missing FK** — task references `projectId` or `workspace` not present after projects step (34/34 loaded; 9 label-derived workspaces created).
2. **Transform filter** — `transform-tasks.mjs` may skip rows with invalid `tenantId`, empty title, or unmapped assignee.
3. **Duplicate / idempotency** — two Mongo `_id`s collapsed to one PG row (unlikely; SyncMapping would still show 373).

**Next step:** Diff Mongo `tasks` `_id` set against `SyncMapping` where `tscEntityType = 'Task'` and `legacyCollection = 'tasks'` to identify the two missing legacy IDs. Do **not** re-run execute against production.

---

## SyncMapping reconciliation (2481)

ETL execute created **2481** `SyncMapping` rows. Breakdown matches migrated entities:

| `tscEntityType` | Count | Mongo source |
|-----------------|------:|--------------|
| Lead | 2029 | `leads` |
| Task | 371 | `tasks` (373 extracted, 2 missing) |
| Project | 34 | `projects` |
| Person | 16 | `users` |
| User | 16 | `users` |
| Workspace | 9 | label-derived (+ `workspaces` registry = 8 in Mongo) |
| Artist | 4 | `artists` |
| Organization | 2 | `tenants` |
| **Total** | **2481** | |

**Check:** 2029 + 371 + 34 + 16 + 16 + 9 + 4 + 2 = **2481** ✅

Leads (2029) are migrated but **out of scope** for the seven-entity table above.

---

## Out-of-P0 entities (reference)

| Entity | Mongo | PG | Notes |
|--------|------:|---:|-------|
| Organizations | 2 | 3 | +1 pre-seed org |
| Leads | 2029 | 2029 | ✅ P0 |
| Workspaces | 8 (registry) | 14 | 9 migrated + label-derived; includes pre-seed |
| Persons | — | 21 | 16 migrated + 5 pre-seed |

---

## Reconciliation verdict

| Check | Result |
|-------|--------|
| P0 core entities (Users†, Artists, Projects) | ✅ Parity on migrated rows |
| Tasks | ⚠️ **373 vs 371** — 2 tasks missing; SyncMapping confirms 371 |
| Contracts | ✅ 0 = 0 |
| Invoices / Files | ⬜ **Not in P0 ETL** — 257 Mongo docs; 0 PG rows |
| SyncMapping | ✅ **2481** verified |

†Users: migrated 16 = 16; total PG 19 includes seed.

**Gate:** Task gap must be root-caused before production cutover. Invoices, files, and contracts require P1+ ETL ([02-schema-mapping](./02-schema-mapping.md) §5.7, P1).

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-14 | Agent L7 — post-execute Mongo↔Postgres reconciliation; SyncMapping 2481; tasks −2 noted |
