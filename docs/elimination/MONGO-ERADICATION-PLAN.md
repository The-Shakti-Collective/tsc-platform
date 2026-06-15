# Mongo Eradication Plan — CoreKnot (Agent 04)

> **Authority:** [MONGO-SUNSET-REPORT.md](../architecture/MONGO-SUNSET-REPORT.md)  
> **Date:** 2026-06-15  
> **Scope:** `apps/coreknot/` (client, server, workers) + CoreKnot docs  
> **Status after Worker B:** **NOT MET** — runtime still requires Mongo by default

---

## Executive summary

| Metric | Count / state |
|--------|----------------|
| npm runtime deps | `mongoose@^7.0.3`, `mongodb@^6.20.0` in `apps/coreknot/server/package.json` |
| Mongoose model files (root `models/`) | **89** (23 re-export shims → `domains/*/models`) |
| Domain-local Mongoose models | **26** |
| Runtime JS files referencing mongoose/mongodb | **~180** (excl. `scripts/`, `tests/`) |
| One-off Mongo scripts (`server/scripts/`) | **117** files |
| ETL tooling (`scripts/migrations/coreknot/`) | **42** files (offline) |
| Client Mongo usage | **0** (package-lock transitive only) |
| Default boot mode | `COREKNOT_MONGO_REQUIRED` unset → **mongo required** |

**Worker B P0 fix:** Corrected broken `createLegacyRepository.js` import (`./prismaClient` → `../infrastructure/postgres/prismaClient`). P1 repositories (attendance, mail, finance, calendar, etc.) now load without `MODULE_NOT_FOUND`.

---

## Before / after (this session)

| Area | Before | After | Risk |
|------|--------|-------|------|
| `createLegacyRepository.js` | Broken import; P1 repos fail on `require()` | Fixed path to `infrastructure/postgres/prismaClient` | Low — import-only fix |
| Root orphan scripts | Unmarked one-offs in `server/` root | `@deprecated` headers + `scripts/MONGO-LEGACY-README.md` | None — docs only |
| Elimination docs | Missing | This plan + [COREKNOT-REFORM-REPORT.md](./COREKNOT-REFORM-REPORT.md) | None |
| Mongo runtime removal | Not started | Not started (documented only) | N/A |

**Rollback:** Revert commit; restore `./prismaClient` import only if a shim file is added (not recommended).

---

## Classification — REMOVE / REPLACE / ARCHIVE

### REMOVE (post-cutover only — do not delete until exit criteria met)

| Artifact | Path | Files | Replacement |
|----------|------|-------|-------------|
| Mongo connection | `services/mongoConnectionService.js` | 1 | Prisma `DATABASE_URL` |
| requireMongo gate | `middleware/requireMongo.js` | 1 | Store-aware middleware per domain |
| Mongoose models | `models/*.js` | 89 | Prisma models + `domains/*/repositories` |
| Domain Mongoose models | `domains/*/models/*.js` | 26 | Prisma entity tables |
| Legacy repo factories | `repositories/createLegacyRepository.js`, `createTenantRepository.js` | 2 | Native Prisma repos |
| GridFS backup | `services/databaseBackupService.js` | 1 | Neon PITR + R2 |
| Mongo sync writer | `services/sync/handlers/mongoSyncWriter.js` | 1 | Postgres event bus only |
| ID helpers (mongo-specific) | `utils/mongoId.js`, `utils/mongoColdArchiveTtl.js` | 2 | cuid/UUID + Postgres TTL |
| Health Mongo probe | `services/SystemHealthService.js`, `systemHealthProbeService.js` | 2 | Postgres-only readiness |
| Config Mongo URIs | `config/database.js`, `config/index.js` | 2 | Remove from schema |
| Tenant plugin (Mongo) | `plugins/tenantPlugin.js` | 1 | Postgres `organizationId` scope |
| Env vars | `MONGODB_*`, `MONGO_URI`, `MAIL_USE_PROD_DB`, etc. | 8+ | Delete from Railway/Vercel dashboards |

### REPLACE (in-flight — dual-write / flag flip)

| Domain | Flag | Priority | Prisma target | Runtime path |
|--------|------|----------|---------------|--------------|
| Auth | `COREKNOT_AUTH_STORE` | P0 | `User`, `CkLegacyStaffUser` | `repositories/staffUserRepository.js` |
| Tenant | `COREKNOT_TENANT_STORE` | P0 | `Organization`, `CkLegacyTenant` | `repositories/tenantRepository.js` |
| Projects | `COREKNOT_PROJECTS_STORE` | P0 | `Project`, `Workspace` | `repositories/projectRepository.js` |
| Tasks | `COREKNOT_TASKS_STORE` | P0 | `Task`, assignees | `repositories/taskRepository.js` |
| CRM | `COREKNOT_CRM_STORE` | P0 | `Lead`, `Inquiry` | `repositories/leadRepository.js` |
| Artists | `COREKNOT_ARTISTS_STORE` | P0 | `Artist` | `repositories/artistRepository.js` |
| Mail | `COREKNOT_MAIL_STORE` | P1 | `CkLegacyDocument` mirror | `repositories/mailCampaignRepository.js` |
| Data hub | `COREKNOT_DATAHUB_STORE` | P1 | Person hub tables | `repositories/dataHubPersonRepository.js` |
| Attendance | `COREKNOT_ATTENDANCE_STORE` | P1 | TBD Prisma schema | `repositories/attendanceRepository.js` |
| Finance | `COREKNOT_FINANCE_STORE` | P1 | `Expense` + R2 blobs | `repositories/financeRepository.js` |
| Newsletter | `COREKNOT_NEWSLETTER_STORE` | P2 | TBD | `repositories/newsletterRepository.js` |
| Integrations | `COREKNOT_INTEGRATIONS_STORE` | P2 | `IntegrationConnection` | `repositories/integrationsRepository.js` |
| Gamification | `COREKNOT_GAMIFICATION_STORE` | P2 | Config snapshots | `repositories/gamificationRepository.js` |
| Calendar | `COREKNOT_CALENDAR_STORE` | P2 | TBD | `repositories/calendarRepository.js` |
| Notifications | `COREKNOT_NOTIFICATIONS_STORE` | P2 | Split from Platform | `repositories/notificationRepository.js` |

**Master switches** (`infrastructure/postgres/migrationProfile.js`):

- `COREKNOT_POSTGRES_ENABLED=true`
- `COREKNOT_POSTGRES_PRIMARY=true` (Postgres authoritative)
- `COREKNOT_MONGO_REQUIRED=false` (boot without Mongo)
- `COREKNOT_DISABLE_GRIDFS_BACKUP=true`

### ARCHIVE (keep in git; remove from runtime path after cutover)

| Path | Files | Action |
|------|-------|--------|
| `apps/coreknot/server/scripts/` (Mongo one-offs) | 117 | Move to `scripts/archive/mongo/` after 30-day parallel-run |
| `apps/coreknot/server/scripts/MONGO-LEGACY-README.md` | 1 | Index of legacy scripts |
| Root orphan scripts (`migrate_attendance.js`, etc.) | 8 | Deprecated; archive with scripts |
| `scripts/migrations/coreknot/` | 42 | Keep until parity signed; then `docs/archive/` |
| `scripts/coreknot/migrate-mongo-to-tsc.mjs` | 1 | Archive |
| `e2e/migration/count-parity.mjs` | 1 | Repurpose for Postgres parity |
| `services/supabase/*` | ~5 | Deprecated secondary store — archive |
| `domains/tasks/repositories/taskReadRepository.js` | 1 | Supabase hybrid read — remove with Supabase sunset |

---

## P0 / P1 / P2 migration plan

### P0 — Wave 1 (blocking production cutover)

**Goal:** Core ops domains read/write Postgres; Mongo optional for dev.

| Step | Command / action | Owner | Blocker? |
|------|------------------|-------|----------|
| 1 | `pnpm migrate:coreknot:p0:execute` — ETL auth, tenant, projects, tasks, CRM, artists | DevOps | Yes — data |
| 2 | `pnpm migrate:coreknot:count-parity` — row counts vs Mongo | QA | Yes — verification |
| 3 | Staging: flip all P0 `COREKNOT_*_STORE=postgres` | Founder | Yes — env |
| 4 | `pnpm migrate:coreknot:verify-cutover --ping` | DevOps | Yes |
| 5 | 30-day production parallel-run (Mongo shadow + Postgres primary) | Founder | Yes — sign-off |
| 6 | `COREKNOT_MONGO_REQUIRED=false` on staging → prod | Founder | Yes |
| 7 | Remove `mongoose`/`mongodb` from `package.json` | Backend | After step 6 |

**P0 code remaining:** ~6 repository files with dual-write logic, 15 domain Mongoose models for P0 entities, `mongoConnectionService`, `requireMongo`, health probes.

### P1 — Wave 2 (mail, finance, attendance, data hub)

| Step | Action |
|------|--------|
| 1 | Prisma schema for Attendance, Calendar, Mail campaign native tables (not just `CkLegacyDocument`) |
| 2 | `pnpm migrate:coreknot:p1` ETL |
| 3 | GridFS → R2 migration for `FinanceDocument` attachments |
| 4 | Flip P1 store flags; mail worker (`workers/startWorkers.js`) Postgres-only |
| 5 | Disable `databaseBackupService` GridFS path |

**P1 code remaining:** 11 `createLegacyRepository` consumers, `mailCampaignBatch.js`, `financeController` GridFS reads.

### P2 — Wave 3 (gamification, newsletter, integrations, notifications)

| Step | Action |
|------|--------|
| 1 | Flip remaining `COREKNOT_*_STORE` flags |
| 2 | Archive 117 `server/scripts/` Mongo ops files |
| 3 | Deprovision Atlas cluster |
| 4 | Delete `MONGODB_*` from all env dashboards |

---

## P0 blockers (cannot remove Mongo today)

| ID | Blocker | Mitigation |
|----|---------|------------|
| B1 | P0 ETL not executed / parity not signed | Run `migrate:coreknot:p0:execute` + count-parity |
| B2 | P1 domains (mail, finance, attendance) have no native Prisma tables | Schema design + R2 for finance blobs |
| B3 | GridFS attachments still served for finance | R2 cutover + signed URLs |
| B4 | Workers (`statsWorker`, `importWorker`, mail batch) assume Mongo | Rewire to Postgres repos |
| B5 | Founder env: `MONGODB_URI_PROD` still on Railway | Parallel-run checklist in `docs/migration/PRODUCTION-CUTOVER.md` |
| B6 | 30-day parallel-run not complete | Founder sign-off per MONGO-SUNSET-REPORT |

---

## Exit criteria checklist

- [ ] All `COREKNOT_*_STORE=postgres` in production
- [ ] `COREKNOT_MONGO_REQUIRED=false` — server boots without Mongo
- [ ] `/api/health/ready` passes without Mongo probe
- [ ] `mongoose` removed from `package.json`
- [ ] No `MONGODB_*` in production env dashboards
- [ ] 30-day parallel-run complete
- [ ] GridFS attachments on R2
- [ ] Atlas cluster deprovisioned

---

## Recommended sequence (unchanged from sunset report)

1. Complete P0 ETL → parity → staging flag flip  
2. Production parallel-run (30 days)  
3. P1 schema + ETL + R2  
4. `COREKNOT_MONGO_REQUIRED=false`  
5. Archive scripts; remove Mongoose deps  
6. Deprovision Atlas  

---

## Risk if Mongo removed prematurely

- Mail campaign dispatch failure  
- Finance document download failure (GridFS)  
- Attendance history inaccessible  
- CRM lead writes lost if Postgres ETL incomplete  

**Do not remove Mongo from production until parity scripts pass and founder signs cutover checklist.**
