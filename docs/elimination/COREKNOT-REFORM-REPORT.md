# CoreKnot Domain Reform Report — Agent 05

> **Date:** 2026-06-15  
> **Scope:** `apps/coreknot/server/`, `apps/coreknot/client/`, workers  
> **Cross-ref:** [COREKNOT-DOMAIN-CERTIFICATE.md](../readiness/COREKNOT-DOMAIN-CERTIFICATE.md) · [MONGO-ERADICATION-PLAN.md](./MONGO-ERADICATION-PLAN.md)

---

## Verdict

**FAIL** — domains are structurally present with partial Postgres dual-write, but Mongo remains the default runtime store. One **P0 code defect** (broken `createLegacyRepository` import) fixed this session. No large refactors applied — safe duplicate patterns documented for phased cleanup.

---

## Domain validation matrix

| Domain | Routes | Service layer | Repository | Prisma schema | Mongo model | Store flag | Status |
|--------|--------|---------------|------------|---------------|-------------|------------|--------|
| **CRM** | `crmRoutes.js` | `domains/crm/services/*` | `leadRepository.js` | `Lead`, `Inquiry` | `domains/crm/models/Lead.js` | `COREKNOT_CRM_STORE` | ⚠️ Dual-write |
| **Projects** | `projectRoutes.js` | `domains/projects/services/*` | `projectRepository.js` | `Project`, `Workspace` | `domains/projects/models/Project.js` | `COREKNOT_PROJECTS_STORE` | ⚠️ Dual-write |
| **Tasks** | `taskRoutes.js` | `domains/tasks/services/TaskService.js` | `taskRepository.js` | `Task`, assignees | `domains/tasks/models/Task.js` | `COREKNOT_TASKS_STORE` | ⚠️ Dual-write |
| **Attendance** | `attendanceRoutes.js` | inline in routes + utils | `attendanceRepository.js` (legacy) | ❌ None | `models/Attendance.js` | `COREKNOT_ATTENDANCE_STORE` | ❌ Mongo only |
| **Finance** | `financeRoutes.js` | `controllers/financeController.js` | `financeRepository.js` (legacy) | `Expense` partial | `models/FinanceDocument.js` | `COREKNOT_FINANCE_STORE` | ❌ GridFS blobs |
| **Contracts** | via `artistOsService` | `domains/artists/services/artistOsService.js` | direct Mongoose | Platform `Contract` | `models/ArtistContract.js` | — | ⚠️ Artist-scoped only |
| **Automation** | — | Platform API `AutomationRule` | — | Platform-owned | — | — | ✅ Boundary correct |
| **Calendar** | `calendarRoutes.js` | `scheduleService.js` | `calendarRepository.js` (legacy) | ❌ None | `models/CalendarEvent.js` | `COREKNOT_CALENDAR_STORE` | ❌ Mongo only |
| **Notifications** | `notificationRoutes.js` | `notificationDispatcher.js` | `notificationRepository.js` | `Notification` (shared) | `models/Notification.js` (deprecated) | `COREKNOT_NOTIFICATIONS_STORE` | ⚠️ Local-first UI |
| **Mail** | `mailRoutes.js` + `domains/mail/` | `domains/mail/services/*` | `mailCampaignRepository.js` | TBD | `domains/mail/models/*` | `COREKNOT_MAIL_STORE` | ❌ Mongo campaigns |
| **Artists** | `artistRoutes.js`, `artistV2Routes.js` | `domains/artists/services/*` | `artistRepository.js` | `Artist` | `models/Artist.js` + 20 artist models | `COREKNOT_ARTISTS_STORE` | ⚠️ Dual-write |
| **Integrations** | `integrationsRoutes.js` | controllers | `integrationsRepository.js` | `IntegrationConnection` | various | `COREKNOT_INTEGRATIONS_STORE` | ⚠️ Partial |
| **Gamification** | `gamificationRoutes.js` | `gamificationService.js` | `gamificationRepository.js` | partial | `models/GamificationConfig.js` | `COREKNOT_GAMIFICATION_STORE` | ❌ Mongo |

---

## Architecture patterns (current)

```
routes/*.js
  → domains/{domain}/controllers/*  (P0 domains — partial)
  → controllers/*                   (finance, subscription — legacy flat)
  → repositories/*.js               (canonical data boundary)
      → createTenantRepository      (P0: mongo + postgres dual-write)
      → createLegacyRepository      (P1: ck_legacy_documents mirror)
  → domains/{domain}/models/*.js    (Mongoose schemas)
  → models/*.js                     (23 re-export shims + 66 standalone)
```

**Postgres infrastructure:** `infrastructure/postgres/` — `prismaClient.js`, `writeStrategy.js`, `migrationProfile.js`, `postgresEntityWrites.js`, `postgresEntityMappers.js`.

---

## Duplicate / legacy patterns detected

### 1. Model shim layer (`models/` → `domains/*/models/`)

**23 files** re-export domain models with `@deprecated` headers (Task, Lead, Project, Mail*, CRM*).

| Pattern | Example | Action |
|---------|---------|--------|
| Re-export shim | `models/Task.js` → `domains/tasks/models/Task` | **KEEP** until import sweep; then REMOVE shims |
| Standalone mongo model | `models/Attendance.js`, `models/Artist.js` | **REPLACE** with Prisma + domain move |

**Risk of early removal:** 40+ imports still use `require('../models/Task')` from routes/services/tests.

### 2. Repository indirection (`domains/*/repositories/` → `repositories/`)

Thin re-exports — no logic duplication:

- `domains/crm/repositories/leadRepository.js` → `repositories/leadRepository.js`
- `domains/tasks/repositories/taskRepository.js` → `repositories/taskRepository.js`
- `domains/projects/repositories/projectRepository.js` → `repositories/projectRepository.js`

**Action:** **KEEP** during migration; collapse into `domains/*/repositories/` in P2 cleanup (cosmetic).

### 3. Deprecated Supabase hybrid read

`domains/tasks/repositories/taskReadRepository.js` — Supabase PostgREST fallback when `HYBRID_READ_TASKS=true`.

**Action:** **ARCHIVE** with Supabase sunset (`SUPABASE_SECONDARY_ENABLED=false` already default).

### 4. Flat controllers vs domain modules

| Controller | Location | Domain module? |
|------------|----------|----------------|
| `financeController.js` | `controllers/` | ❌ No `domains/finance/` |
| `subscriptionController.js` | `controllers/` | ❌ |
| `taskController.js` | `domains/tasks/controllers/` | ✅ |
| `projectController.js` | `domains/projects/controllers/` | ✅ |
| `leadQueryService.js` | `domains/crm/services/` | ✅ |

**Action:** **P2** — extract `domains/finance/` when `COREKNOT_FINANCE_STORE=postgres` stabilizes.

### 5. Root orphan scripts (not in `scripts/`)

| File | Purpose | Action |
|------|---------|--------|
| `migrate_attendance.js` | One-off schema migration | **ARCHIVE** |
| `migrateTasks.js` | Assignee split migration | **ARCHIVE** |
| `migrateArtists.js` | Artist migration | **ARCHIVE** |
| `get_projects.js` | Debug dump | **ARCHIVE** |
| `query_tech.js` | Ad-hoc query | **ARCHIVE** |
| `scan_basecamp.js` | Import probe | **ARCHIVE** |
| `test_aisensy.js`, `test-mailer.js` | Manual tests | **ARCHIVE** |

Marked `@deprecated` this session; indexed in `server/scripts/MONGO-LEGACY-README.md`.

### 6. Bug fixed — `createLegacyRepository` import

**Before:** `require('./prismaClient')` — file does not exist; all P1 repos (`attendance`, `mail`, `finance`, `calendar`, `gamification`, etc.) threw on `require()`.

**After:** `require('../infrastructure/postgres/prismaClient')` — verified load OK.

**Impact:** Attendance/finance/mail routes could not load repository module in isolation; likely masked when server booted through different path or recent regression.

---

## Dead / low-value code

| Item | Path | Notes |
|------|------|-------|
| `models/Notification.js` | deprecated comment | Inbox is client-local; server dispatch bypasses |
| `models/TscData.js` | deprecated | Split into OutsourcedRecord, BookedCall, etc. |
| `models/Contact.js` | shim → PersonIndex | Legacy import path |
| `routes/supabaseAdminRoutes.js` | Supabase admin | Deprecated infra |
| `services/supabase/*` | sync, fastMigrate | Deprecated — Neon primary |
| `taskReadRepository.js` | Supabase hybrid | Feature-flagged off by default |
| `repositories/tenantQuery.js` | Mongo query helper | Remove with tenant plugin |

**Not removed this session** — each has transitive requires; remove in P2 after store flags flip.

---

## Workers

| Worker | File | Store | Action |
|--------|------|-------|--------|
| Mail batch | `services/mailCampaignBatch.js` | Mongo `MailCampaign` | REPLACE when `COREKNOT_MAIL_STORE=postgres` |
| Stats | `workers/statsWorker.js` | Mongo aggregations | REPLACE |
| Import | `workers/importWorker.js` | Mongo | REPLACE |
| Orchestrator | `workers/startWorkers.js` | Redis + Mongo | Rewire after P1 |

Railway: `RUN_WORKERS=true` on separate service.

---

## Client (`apps/coreknot/client/`)

- **No Mongo references** in source
- Calls CoreKnot API only — correct per production architecture
- Domain UI coverage: CRM, projects, tasks, finance, attendance, calendar, mail, artists — all present

No client refactor required for Mongo sunset.

---

## Safe refactors completed (this session)

| Change | Files | Risk |
|--------|-------|------|
| Fix `createLegacyRepository` prisma import | 1 | Low — verified 4 P1 repos load |
| Deprecation headers on root orphan scripts | 8 | None |
| `scripts/MONGO-LEGACY-README.md` index | 1 | None |
| Elimination documentation | 2 | None |

---

## Recommended reform sequence

### Phase 1 (with P0 mongo cutover)

1. Import sweep: `models/Task` → `domains/tasks/models/Task` (codemod, 40 files)
2. Add `requireStore` middleware pattern (generalize `requireAuthStore`) per domain flag
3. Remove `taskReadRepository` + Supabase services

### Phase 2 (P1 domains)

1. Create `domains/finance/`, `domains/attendance/` modules
2. Move `financeController` into domain folder
3. Native Prisma repos replacing `createLegacyRepository` for attendance/finance/mail

### Phase 3 (post-Atlas deprovision)

1. Delete `models/` shims and standalone Mongoose files (115 files)
2. Archive `server/scripts/` to `scripts/archive/mongo/` (117 files)
3. Remove `createTenantRepository`, `tenantPlugin`, `mongoId.js`
4. Collapse `domains/*/repositories` re-exports into canonical location

---

## Before / after / rollback

| State | Description |
|-------|-------------|
| **Before** | P1 repos broken on require; 89+26 Mongoose models; flat finance controller; Supabase hybrid path dormant |
| **After** | P1 repos load; orphan scripts marked; reform roadmap documented |
| **Rollback** | Revert single import fix if unexpected Postgres path regression (unlikely) |

---

## P0 blockers for domain certification

1. P0 store flags still default `mongo` in `.env.example`
2. Attendance + Calendar have no Prisma schema
3. Finance GridFS not on R2
4. Mail campaigns lack native Postgres tables
5. ETL + parity not signed (founder gate)

**Agent 05 verdict: FAIL** — structure is reformable; execution blocked on Mongo sunset P0 gates.
