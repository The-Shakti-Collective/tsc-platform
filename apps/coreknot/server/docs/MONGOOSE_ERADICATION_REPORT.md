# CoreKnot Mongoose Eradication Report

**Mission:** CoreKnot Mongo Sunset — Agent 5  
**Date:** 2026-06-16  
**Scope:** `apps/coreknot/server` (read-only audit)  
**Note:** Agent 5 subagent transcript was unavailable at Agent 6 handoff; this report was reconstructed from a full-repo grep audit using the same acceptance criteria (no runtime path may import mongoose when all store flags are `postgres`).

---

## Executive summary

| Metric | Count |
|--------|------:|
| Files with `require('mongoose')` | ~230 |
| Files with `mongoose.model(` | ~88 |
| Runtime paths (excl. scripts/tests) still importing mongoose | **52** |
| Mongoose model definition files | **88** |
| Store flags set to `postgres` in local `.env` | **15 / 16** |

**Verdict:** Postgres-primary mode (`COREKNOT_MONGO_REQUIRED=false`) skips Mongo **connect** at boot, but **dozens of runtime modules still import mongoose** — lazy model loads, ID validation, and dual-write fallbacks remain. Acceptance criterion *"no runtime path imports mongoose"* is **not met**.

---

## Store flags (local `apps/coreknot/server/.env`)

| Flag | Value | Postgres gate |
|------|-------|---------------|
| `COREKNOT_AUTH_STORE` | postgres | `isPostgresAuthEnabled()` |
| `COREKNOT_TENANT_STORE` | postgres | `isPostgresTenantEnabled()` |
| `COREKNOT_PROJECTS_STORE` | postgres | `isPostgresProjectsEnabled()` |
| `COREKNOT_TASKS_STORE` | postgres | `isPostgresTasksEnabled()` |
| `COREKNOT_CRM_STORE` | postgres | `isPostgresCrmEnabled()` |
| `COREKNOT_ARTISTS_STORE` | postgres | `isPostgresArtistsEnabled()` |
| `COREKNOT_MAIL_STORE` | postgres | `isPostgresMailEnabled()` |
| `COREKNOT_DATAHUB_STORE` | postgres | `isPostgresDataHubEnabled()` |
| `COREKNOT_ATTENDANCE_STORE` | postgres | `isPostgresAttendanceEnabled()` |
| `COREKNOT_FINANCE_STORE` | postgres | `isPostgresFinanceEnabled()` |
| `COREKNOT_NEWSLETTER_STORE` | postgres | `isPostgresNewsletterEnabled()` |
| `COREKNOT_INTEGRATIONS_STORE` | postgres | `isPostgresIntegrationsEnabled()` |
| `COREKNOT_GAMIFICATION_STORE` | postgres | `isPostgresGamificationEnabled()` |
| `COREKNOT_CALENDAR_STORE` | postgres | `isPostgresCalendarEnabled()` |
| `COREKNOT_NOTIFICATIONS_STORE` | postgres | `isPostgresNotificationsEnabled()` |
| `COREKNOT_CUSTOMIZATION_STORE` | **unset** (defaults mongo) | `isPostgresCustomizationEnabled()` → false |
| `COREKNOT_MONGO_REQUIRED` | false | Skips `connectMongo()` |
| `COREKNOT_POSTGRES_PRIMARY` | true | Postgres-first writes |

**Gap:** `COREKNOT_CUSTOMIZATION_STORE` not set locally; `railway.env.example` sets it to `postgres`.

---

## Boot-chain mongoose findings

| File | Behavior | Risk |
|------|----------|------|
| `app/startServer.js` | Top-level `require('mongoose')`; `connectMongoOnStartup()` skipped when `COREKNOT_MONGO_REQUIRED=false` | **P1** — import remains; any accidental model load still pulls mongoose |
| `services/mongoConnectionService.js` | Connection, defaults, side-effect bootstrap | **P0** — delete or gate behind feature flag after cutover |
| `middleware/requireMongo.js` | Hard dependency on mongoose connection state | **P0** — routes using this middleware block in postgres-only mode |
| `infrastructure/postgres/writeStrategy.js` | Lazy `require('mongoose')` for mirror writes | **P1** — dual-write path |
| `workers/startWorkers.js` | Conditional mongoose for stats/import workers | **P1** |
| `app/startupBanner.js` | Reports mongoose connection state | **P2** |

---

## Priority tables

### P0 — MUST MIGRATE (blocks postgres-only runtime)

| Path | Issue | Action |
|------|-------|--------|
| `domains/tasks/controllers/taskController.js` | `mongoose.startSession()`, `ObjectId.isValid()` on hot paths | Replace with Prisma transactions + cuid validation |
| `domains/tasks/services/TaskService.js` | Direct mongoose model usage | Route through Prisma task repository only |
| `repositories/leadRepository.js` | Lazy-loads `domains/crm/models/Lead` mongo repo | Remove mongo branch when `COREKNOT_CRM_STORE=postgres` |
| `repositories/artistRepository.js` | Mongoose import at top level | Postgres-only artist repo |
| `repositories/createCampaignRepository.js` | Mongoose for mail campaigns | Prisma / legacy JSON store |
| `domains/mail/webhooks/resendWebhookHandler.js` | Mongoose campaign updates | Postgres mail store |
| `services/mailCampaignBatch.js` | Mongoose batch reads | Postgres |
| `routes/gamificationRoutes.js` | Mongoose queries | Prisma or `CkLegacyDocument` |
| `services/gamificationService.js` | Mongoose XP/attendance | Postgres gamification tables (TBD) |
| `middleware/requireMongo.js` | Enforces mongo connection | Remove or replace with `requirePostgres` |
| `services/mongoConnectionService.js` | Boot-time mongo | Archive after cutover |
| `plugins/tenantPlugin.js` | Mongoose schema plugin | N/A for Prisma — delete with models |
| `utils/crmScope.js`, `utils/crmAssignment.js` | ObjectId filters | Cuid / `SyncMapping` lookups |
| `utils/todoQueryBuilder.js`, `utils/mongoId.js` | ObjectId assumptions | Cuid helpers |

### P1 — MUST MIGRATE (dual-write / health / workers)

| Path | Issue |
|------|-------|
| `services/SystemHealthService.js` | Mongo ping in health |
| `services/systemHealthProbeService.js` | Mongo probe |
| `services/databaseBackupService.js` | GridFS / mongo backup |
| `services/backgroundQueue.js` | Mongoose job metadata |
| `workers/statsWorker.js`, `workers/importWorker.js` | Mongo reads |
| `services/sync/handlers/mongoSyncWriter.js` | Mirror writer |
| `services/PersonIdentityService.js`, `PersonHubBuilder.js` | Person graph in mongo |
| `domains/projects/services/projectGoalsService.js` | Project goals mongo |
| `domains/integrations/controllers/exlyController.js` | Mongoose bookings |
| `domains/artists/services/artistPathHubService.js` | Artist path mongo |
| `controllers/orgAccountController.js`, `subscriptionController.js` | Legacy controllers |
| `infrastructure/postgres/writeStrategy.js` | Mongo mirror branch |

### P2 — SAFE TO ARCHIVE (after P0/P1 cutover)

All files under `apps/coreknot/server/models/` (**62 files**) and `domains/*/models/` (**22 files**) — mongoose schema definitions superseded by Prisma or `CkLegacyDocument`.

Representative list:

- Auth/tenant: `User.js`, `Tenant.js`, `Department.js`, `Team.js`
- Workspace (mongo): `models/Workspace.js` (distinct from Prisma `Workspace`)
- CRM: `domains/crm/models/Lead.js`, `CRMConfig.js`, `CRMAudit.js`, …
- Tasks/projects: `domains/tasks/models/Task.js`, `domains/projects/models/Project.js`, …
- Mail: `domains/mail/models/Campaign.js`, `MailCampaign.js`, …
- Artists: `models/Artist.js`, `ArtistGig.js`, … (20+ artist collections)
- Ops: `Attendance.js`, `FinanceDocument.js`, `CalendarEvent.js`, `Notification.js`, …

### P3 — SAFE TO DELETE (scripts, tests, one-offs)

| Category | Count | Examples |
|----------|------:|----------|
| `scripts/` migration & QA | ~120 | `migrateTasks.js`, `runQAScan.js`, `seedE2eTasks.js` |
| Root one-off scripts | 8 | `query_tech.js`, `scan_basecamp.js`, `migrateArtists.js` |
| Tests | 7 | `tests/setup.js`, `gamificationService.test.js` |
| Dev utilities | 4 | `test-mailer.js`, `test_aisensy.js` |

Keep `scripts/MONGO-LEGACY-README.md` until archive complete.

---

## Runtime paths still importing mongoose (excl. scripts/tests/models)

```
app/startServer.js
app/startupBanner.js
controllers/orgAccountController.js
controllers/subscriptionController.js
domains/artists/services/artistEnquiryService.js
domains/artists/services/artistPathHubService.js
domains/integrations/controllers/exlyController.js
domains/mail/controllers/campaignsController.js
domains/mail/webhooks/resendWebhookHandler.js
domains/projects/services/projectAnalyticsService.js
domains/projects/services/projectGoalsService.js
domains/tasks/controllers/taskController.js
domains/tasks/services/TaskService.js
infrastructure/postgres/writeStrategy.js
middleware/requireMongo.js
plugins/tenantPlugin.js
repositories/artistRepository.js
repositories/createCampaignRepository.js
repositories/createCustomizationRepository.js
repositories/createLegacyRepository.js
repositories/createTenantRepository.js
repositories/leadRepository.js
repositories/tenantQuery.js
routes/gamificationRoutes.js
routes/logRoutes.js
services/PersonHubBuilder.js
services/PersonIdentityService.js
services/SystemHealthService.js
services/backgroundQueue.js
services/databaseBackupService.js
services/gamificationService.js
services/mailCampaignBatch.js
services/mongoConnectionService.js
services/reviewExploitRepairService.js
services/subscriptionReminderService.js
services/sync/handlers/mongoSyncWriter.js
services/supabase/fastMigrate.js
services/supabase/syncService.js
services/systemHealthProbeService.js
services/systemLogService.js
services/qa/qaExtendedProbes.js
services/qa/qaIntegrationRunners.js
services/qa/qaIntegrationTests.js
utils/campaignStats.js
utils/crmAssignment.js
utils/crmScope.js
utils/ensureDataHubBootstrap.js
utils/ensureDevAdminUser.js
utils/mongoId.js
utils/primaryCallAssignee.js
utils/todoQueryBuilder.js
workers/importWorker.js
workers/startWorkers.js
workers/statsWorker.js
```

---

## Recommended eradication order (for Agents 1–4 follow-up)

1. **Tasks** — `taskController.js` + `TaskService.js` (highest traffic, mongo sessions)
2. **CRM** — `leadRepository.js` + crm utils (2029 leads already in Postgres)
3. **Mail** — campaign repo + resend webhook + batch service
4. **Auth/tenant** — remove `requireMongo`, retire `mongoConnectionService` when `COREKNOT_MONGO_REQUIRED=false` in prod
5. **Gamification / attendance / finance** — still mongo-only schemas; migrate to Prisma or `CkLegacyDocument`
6. **Archive** all `models/` and `domains/*/models/` directories
7. **Delete** `scripts/` mongo migrations and test fixtures

---

## Acceptance status (Agent 5 criteria)

| Criterion | Status |
|-----------|--------|
| Report generated with SAFE TO DELETE / ARCHIVE / MUST MIGRATE | **PASS** |
| Store flags documented | **PASS** |
| Boot-chain findings documented | **PASS** |
| No runtime path imports mongoose | **FAIL** (52 runtime files) |

---

## Handoff to Agent 6

Database validation (Agent 6) should treat Prisma models as canonical for workspace/task/lead/org boundaries. Mongo models in `models/Workspace.js` and `domains/tasks/models/Task.js` are **legacy parallel schemas** — do not use for FK validation.
