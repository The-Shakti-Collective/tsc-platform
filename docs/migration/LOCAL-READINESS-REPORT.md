# Local Readiness Report — Wave L0 + Wave 1 + Wave 2 + Wave 3 prep

**Date:** 2026-06-15  
**Scope:** Local-only CoreKnot migration validation

---

## Executive verdict

| Field | Value |
|-------|-------|
| **LOCAL STATUS** | **GREEN** (Wave 1 dual-write + parity) · **YELLOW** (full e2e with all postgres flags — run stack locally) |
| Rationale | Count-parity **WITHIN_TOLERANCE** (2026-06-15). Wave 1 writes mirror Mongo→Postgres when flags on. Wave 2 repos + `ck_legacy_documents` ready. |

---

## Wave 1 — P0 runtime (reads + writes)

| Domain | Flag | Write status |
|--------|------|--------------|
| Auth / users | `COREKNOT_AUTH_STORE=postgres` | ✅ dual-write via `staffUserRepository` |
| Organizations | `COREKNOT_TENANT_STORE=postgres` | ✅ read + `ensureDefaultTenant` |
| Projects | `COREKNOT_PROJECTS_STORE=postgres` | ✅ create/update/delete mirror |
| Tasks | `COREKNOT_TASKS_STORE=postgres` | ✅ create/update/delete mirror |
| CRM leads | `COREKNOT_CRM_STORE=postgres` | ✅ create/update/delete mirror |
| Artists | `COREKNOT_ARTISTS_STORE=postgres` | ✅ create/save mirror |

**Pattern:** Mongo primary write → fire-and-forget Postgres upsert + `SyncMapping` (canonical entities) or `ck_legacy_*` (auth).

---

## Wave 2 — P1 repos (read + write mirror)

Nine repositories under `apps/coreknot/server/repositories/*Repository.js` using `createLegacyRepository.js` + `CkLegacyDocument` table.

Default: `mongo`. Enable per-domain with `COREKNOT_*_STORE=postgres`.

---

## Wave 3 — Decommission prep

| Item | Status |
|------|--------|
| `COREKNOT_DISABLE_GRIDFS_BACKUP=true` | ✅ gates GridFS in `databaseBackupService.js` |
| Local all-postgres `.env` block | ✅ `apps/coreknot/server/.env.example` |
| `COREKNOT_MONGO_REQUIRED=false` | ✅ documented |
| CI `migrate:coreknot:p0` dry-run | ✅ `.github/workflows/runtime-validation.yml` |
| Rollback test | Manual: set all flags to `mongo`, restart |

---

## Latest validation (2026-06-15)

| Command | Result |
|---------|--------|
| `pnpm db:push` | **PASS** (Neon dev) |
| `pnpm migrate:coreknot:count-parity` | **PASS** — WITHIN_TOLERANCE |
| `pnpm --filter @tsc/coreknot-server test:migration-stores` | **BLOCKED locally** — Jest + Windows path spaces (see V-005); run in CI or junction path |
| `pnpm test:e2e:coreknot` | **NOT RUN** — start stack first |

---

## Local all-postgres profile

Uncomment block in `apps/coreknot/server/.env.example` after ETL + auth seed. Requires Mongo for dual-write unless `COREKNOT_MONGO_REQUIRED=false` (read-only postgres mode — writes still attempt Mongo mirror).

---

## Founder blockers (prod cutover)

| ID | Blocker |
|----|---------|
| F1 | Neon production `DATABASE_URL` on Render |
| F2 | Clerk bulk import — replace placeholder `User.clerkUserId` |
| F3 | Atlas read-only URI for final prod ETL delta |
| F4 | DNS / deploy with Postgres env |
| F5 | Mongo Atlas sunset after 30-day parallel run |

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-15 | Wave 1 dual-write, Wave 2 repos, Wave 3 prep |
| 2026-06-14 | Wave 1 read paths + artists |
| 2026-06-14 | **GREEN** — api-smoke 15/15; coreknot e2e 7/7 baseline |
