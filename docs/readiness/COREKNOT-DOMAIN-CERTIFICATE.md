# CoreKnot Domain Certificate (Agent 21)

> **Date:** 2026-06-15  
> **Scope:** `apps/coreknot/server/` + Prisma CoreKnot tables  
> **Verdict:** **FAIL** — domains exist but Mongo runtime required; Postgres path partial.

Cross-reference: [MONGO-SUNSET-REPORT.md](../architecture/MONGO-SUNSET-REPORT.md) · [COREKNOT-BOUNDARY.md](../architecture/COREKNOT-BOUNDARY.md)

---

## Module audit matrix

| Domain | Schema (Prisma) | Mongo models | Postgres flag | Routes | UI (client) | Permissions |
|--------|-----------------|--------------|---------------|--------|-------------|-------------|
| **CRM** | `Lead`, `Inquiry` | ✅ leads | `COREKNOT_CRM_STORE` | `crmRoutes.js`, `domains/crm/` | ✅ | JWT + tenant |
| **Projects** | `Project`, `ProjectMember` | ✅ Project | `COREKNOT_PROJECTS_STORE` | `projectRoutes.js` | ✅ | JWT + tenant |
| **Tasks** | `Task`, assignees, comments | ✅ Task | `COREKNOT_TASKS_STORE` | `taskRoutes.js` | ✅ | JWT + tenant |
| **Finance** | `Expense`, partial | ✅ finance docs | Partial | `financeRoutes.js` | ✅ | JWT; GridFS attachments |
| **Attendance** | ❌ Not in Prisma | ✅ | — | `attendanceRoutes.js` | ✅ | JWT |
| **Contracts** | `Contract`, `ContractTemplate` | ⚠️ | Platform API primary | Limited CoreKnot | ⚠️ | — |
| **Automation** | Platform `AutomationRule` | ✅ rules | — | intelligence routes | ✅ | JWT |
| **Calendar** | ❌ Not in Prisma | ✅ | — | `calendarRoutes.js` | ✅ | JWT |
| **Notifications** | `Notification` (shared) | ✅ | — | `notificationRoutes.js` | ✅ | JWT |
| **Mail campaigns** | ❌ | ✅ MailCampaign | `COREKNOT_MAIL_STORE` TBD | `mailRoutes.js` | ✅ | JWT |
| **Artists (roster)** | `Artist` (shared) | ✅ | `COREKNOT_ARTISTS_STORE` | `artistRoutes.js` | ✅ | JWT |
| **Integrations** | `IntegrationConnection` | ✅ | Partial | `integrationsRoutes.js` | ✅ | JWT |
| **Analytics** | `AnalyticsMetricSnapshot` | ✅ | — | `analyticsRoutes.js` | ✅ | JWT |

---

## Mongo vs Postgres paths

| Mechanism | File |
|-----------|------|
| Store flags | `apps/coreknot/server/.env.example` — `COREKNOT_*_STORE` |
| Write strategy | `infrastructure/postgres/writeStrategy.js` — dual-write when mirroring |
| Legacy repos | `repositories/createLegacyRepository.js`, `createTenantRepository.js` |
| Postgres repos | `domains/*/repositories/*Repository.js` (tasks, projects, CRM leads) |
| requireMongo | `middleware/requireMongo.js` — **503 without Mongo** |

**Runtime today:** `COREKNOT_MONGO_REQUIRED=true` (default) — production depends on Atlas.

---

## P0 domain cutover status (from MONGO-SUNSET)

| Flag | Prisma target | Code path | Prod-ready |
|------|---------------|-----------|------------|
| `COREKNOT_AUTH_STORE` | User, CkLegacyStaffUser | Partial | ❌ |
| `COREKNOT_TENANT_STORE` | Organization, CkLegacyTenant | Partial | ❌ |
| `COREKNOT_PROJECTS_STORE` | Project, Workspace | Partial | ❌ |
| `COREKNOT_TASKS_STORE` | Task | Partial | ❌ |
| `COREKNOT_CRM_STORE` | Lead, Inquiry | Partial | ❌ |
| `COREKNOT_ARTISTS_STORE` | Artist | Partial | ❌ |

ETL: `scripts/migrations/coreknot/`, parity: `pnpm migrate:coreknot:count-parity`

---

## Platform API duplication (boundary violation)

Platform API modules mirror CoreKnot domains:

- `apps/api/src/modules/crm/`
- `apps/api/src/modules/project/`, `task/`, `workspace/`
- `apps/api/src/modules/coreknot-compat/` — legacy route shapes

**Must not** be used by Website/Community for ops writes post-launch.

---

## UI dependency

CoreKnot client: `apps/coreknot/client/` — Vercel deploy. Known issue H5: monorepo install path may break Vercel builds (`TECH-DEBT-ROADMAP`).

Client calls **CoreKnot API only** — correct per boundary.

---

## Workers

| Worker | File | Dependency |
|--------|------|------------|
| Stats | `workers/statsWorker.js` | Mongo |
| Import | `workers/importWorker.js` | Mongo |
| Mail batch | `services/mailCampaignBatch.js` | Mongo |
| Start | `workers/startWorkers.js` | Redis + Mongo |

Railway: separate worker service with `RUN_WORKERS=true`.

---

## Certification

| Criterion | Result |
|-----------|--------|
| CRM validated | ⚠️ Dual store |
| Projects/Tasks validated | ⚠️ Dual store |
| Finance validated | ❌ Mongo attachments |
| Attendance in Postgres | ❌ |
| No Mongo runtime | ❌ |
| Permissions documented | ✅ JWT + tenant plugin |

**Agent 21 verdict: FAIL**
