## Agent 4 summary — CoreKnot domain mapping

**Ask mode:** did not write `docs/migration/03-domain-mapping.md`. Content below is ready for parent to save.

**Sources:** `apps/coreknot/server/app/registerRoutes.js`, `domains/*`, `routes/*`, `models/*`, `jobs/registry.js`, `services/backgroundQueue.js` vs `apps/api/src/modules/*`, `apps/api/src/queues/queue-registry.service.ts`.

---

# 03 — CoreKnot → TSC API domain mapping

> Legacy: Express + Mongoose (`apps/coreknot/server/`)  
> Target: NestJS + Prisma (`apps/api/src/modules/`)  
> Auth: legacy JWT/session → **Clerk** (`common/auth/clerk-auth.guard.ts`) — no dedicated `auth/` module

## API reuse matrix

| Target domain | API module | Status |
|---|---|---|
| health | `health/` | **Reuse** — `/api/health`, `/live`, `/ready` |
| admin | `admin/` | **Reuse (stub)** — roles, scripts, queue status |
| audit | `audit/` | **Reuse** — replaces CRM audit logs |
| auth | `common/auth/` | **Reuse** — Clerk guard; legacy login/OAuth **new** |
| identity | `identity/` | **Reuse** — person resolve/merge; data-hub person index **new** |
| users | `users/` | **Reuse (partial)** — list/me/create; admin CRUD **new** |
| organizations | `organizations/` | **Reuse (partial)** — absorbs departments, org-accounts, tenant |
| teams | `teams/` | **Reuse (partial)** — basic CRUD; legacy team assignment **new** |
| artists | `artist/` | **Reuse (partial)** — CRUD; OS/workspace/connections **new** |
| crm | `crm/` | **Reuse (partial)** — leads only; imports/followups/EMI **new** |
| inquiries | `inquiries/` | **Reuse** — `ArtistInquiry`, webhooks |
| opportunities | `opportunity/` | **Reuse** — marketplace browse/apply |
| projects | `project/` + `workspace/` | **Reuse (partial)** — workspace-scoped; KRA/goals/analytics **new** |
| (tasks) | `task/` | **Reuse (partial)** — checklist/comments; activity purge **new** |
| calendar | `calendar/` | **Reuse (partial)** — events; schedule view **new** |
| gigs | `gigs/` | **Reuse** — `ArtistGig` |
| finance | `finance/` | **Reuse (partial)** — expenses; legacy doc folders **new** |
| invoices | `invoices/` | **Reuse** — invoice workflow from finance routes |
| contracts | `contract/` | **Reuse** — `ArtistContract` |
| royalties | `royalties/` | **Reuse** — also legacy `ArtistRevenueSource` |
| releases | `releases/` + `content/` | **Reuse** — `ArtistContentRelease`, release campaigns |
| distribution | `distribution/` | **Reuse (scaffold)** — DistroKid adapter |
| media | `media/` | **Reuse** — uploads, assets, release media |
| marketplace | `marketplace/` | **Reuse (scaffold)** |
| messaging | `messaging/` | **Reuse (partial)** — threads; mail/campaigns **new** |
| notifications | `notification/` | **Reuse (partial)** — push/digest cron **new** |
| analytics | `analytics/` | **Reuse (stub)** — compare/sparkline/cumulative |
| ai | `ai/` | **Reuse** — email-writer, pitch, proposal |
| search | `search/` | **Reuse** — Typesense; unified search **new** |
| integrations | `integrations/` | **Reuse (partial)** — Google/Exly/oauth **new** |
| sync | `sync/` | **Reuse** — domain-sync ingest, id mappings |
| data-exchange | `data-exchange/` | **Reuse** — webhooks, exports |

**No target module (map elsewhere):** gamification → `rewards/`; attendance → `organizations/` or new HR; QA → dev-only `admin/`; newsletter → `content/` + `messaging/`; pinboard/notes → `content/` or `workspace/`.

---

## 1. Auth & identity

### Legacy: `domains/auth/` + `/api/auth`, `/api/users`

| Legacy | Target |
|---|---|
| `domains/auth/routes.js` → `authController` (register, login, OAuth, sessions) | **auth** → Clerk + `identity/`; deprecate password flows |
| `domains/auth/userRoutes.js` → `userController` | **users/** (`users.controller.ts`) |
| `domains/auth/models/User` | **users** repository (Prisma User) |
| `validation/schemas/auth.js` | **users/dto**, Clerk webhook DTOs |
| `utils/sessionRegistry`, `tokenRevocation` | **auth** middleware / Clerk session APIs |

**Reuse:** `users/` list, me, create. **New:** OAuth parity, session revoke, admin user CRUD, sales/artist reps, monthly reports.

### Legacy: `domains/person/identity.js` + Person* models + data-hub

| Legacy | Target |
|---|---|
| `Person`, `PersonIndex`, `PersonIdentifier`, `PersonSourceLink`, `PersonHubView`, `PersonCommunicationProfile` | **identity/** + **crm/** (lead linkage) |
| `services/PersonIdentityService.js`, `PersonHubBuilder.js` | **identity.service.ts** |
| `domains/data-hub/*` (people list, reconcile, backups) | **identity/** + **admin/** + **sync/** |

**Reuse:** `identity/` resolve/merge. **New:** data-hub folders, reconcile, backup, inlet processors.

---

## 2. Organizations & teams

### Legacy: `routes/teamRoutes.js`, `departmentRoutes.js`, `orgAccountRoutes.js`, `Tenant`, `Department`, `OrgAccount`

| Legacy | Target |
|---|---|
| `teamController` | **teams/** (`teams.controller.ts`) |
| `departmentRoutes` (inline) + `departmentService` | **organizations/** (dept as org unit) |
| `orgAccountController` + `orgAccountImportService` | **organizations/** import endpoints |
| `models/Team`, `Department`, `Tenant`, `OrgAccount` | **teams/** + **organizations/** repositories |

**Reuse:** teams list/create. **New:** department presets, page permissions, org-account sheet import.

### Legacy: `routes/attendanceRoutes.js`, `LeaveRequest`, `Attendance`

| Legacy | Target |
|---|---|
| Attendance CRUD, leave approval | **organizations/** or future HR module |
| XP hooks (`attendanceXp`) | **rewards/** (gamification bridge) |

**New:** no API parity today.

---

## 3. Artists

### Legacy: `domains/artists/` + `/api/artists`, `/api/v2/artists`, `/api/artist-path`, `/api/auth` (connect)

| Legacy controller | Target |
|---|---|
| `artistController` | **artist/** |
| `artistMembershipController` | **artist/** + **membership/** |
| `artistWorkspaceController` | **workspace/** |
| `artistOsController` | **artist/** + **creative-identity/** |
| `artistAnalyticsController` | **analytics/** + **artist/** |
| `artistShareController` | **artist/** public share |
| `connectionHubController`, `connectionAuthController` | **integrations/** OAuth |
| `artistCrmController` | **crm/** artist-scoped |
| `pathRoutes` + `artistPathHubService` | **inquiries/** + **identity/** |
| `v2Routes` | **artist/** v2 API surface |

| Legacy model | Target |
|---|---|
| `Artist`, `ArtistAuth`, `ArtistMembership` | **artist/** schema |
| `ArtistConnection`, `ArtistSocialProfile`, `ArtistMetrics` | **integrations/** + **artist/** |
| `ArtistPathResponse` | **inquiries/** |
| `ArtistInquiry` | **inquiries/** |
| `ArtistGig` | **gigs/** |
| `ArtistCalendarEvent` | **calendar/** |
| `ArtistFinanceEntry` | **finance/** |
| `ArtistContract` | **contract/** |
| `ArtistContentRelease`, `ArtistReleaseCampaign` | **releases/** + **content/** |
| `ArtistRevenueSource` | **royalties/** |
| `ArtistAsset`, `ArtistAudienceSnapshot` | **media/** + **analytics/** |
| `ArtistActivityLog`, `ArtistTeamNote` | **audit/** + **teams/** |

**Reuse:** artist CRUD, gigs, inquiries, contracts, releases scaffolds. **New:** connection hub, path import, OS workspace, enrichment, Spotify token manager.

---

## 4. CRM & sales

### Legacy: `domains/crm/` + `/api/crm`

| Legacy | Target |
|---|---|
| `crmController`, `artistCrmController` | **crm/** (`crm.controller.ts` — leads only today) |
| `leadService`, `leadQueryService`, `leadWriteService`, `followupService`, `importService` | **crm.service.ts** (expand) |
| `crmStatsService`, `crmConfigService`, `auditService` | **analytics/** + **audit/** + **crm/** |
| `repositories/leadRepository` | **crm.repository.ts** |
| `models/Lead`, `CRMImport`, `CRMConfig`, `CRMAudit`, `CRMStatSnapshot`, `EMI` | **crm/** + **audit/** schema |
| `validation/schemas/crm.js` | **crm/dto** |
| `workers/statsWorker` (CRM snapshots) | **tsc.recommendation** or new `tsc.crm` queue |
| `workers/importWorker` | new **`tsc.import`** queue |
| `POST /api/crm/unsubscribe` | **crm/** + **messaging/** opt-out |

**Reuse:** lead list/create. **New:** import, followups, EMI, export, reset, holy-sheet sync, artist CRM import.

### Legacy: `routes/contactRoutes.js`, `Contact`, `OfficeContact`

| Legacy | Target |
|---|---|
| Office contacts CRUD | **crm/** contacts submodule or **organizations/** |

**New.**

---

## 5. Projects & tasks

### Legacy: `domains/projects/` + `/api/projects`

| Legacy | Target |
|---|---|
| `projectController` (workspaces, members, analytics) | **project/** + **workspace/** |
| `projectGoalsController`, `projectGoalsService` | **project/** goals extension |
| `projectKraController`, `ProjectKRA` | **project/** KRA extension |
| `projectAnalyticsService` | **analytics/** project metrics |
| `projectRepository`, `Project`, `Phase`, `ProjectGoal*` | **project.repository.ts** |
| `validation/schemas/projects.js` | **project/schema** |
| Google calendar link via `integrationsFacade` | **calendar/** + **integrations/** |

**Reuse:** workspace-scoped project CRUD. **New:** KRA, goals, workload, hours summary, plain-text export.

### Legacy: `domains/tasks/` + `/api/tasks`

| Legacy | Target |
|---|---|
| `taskController` | **task/** (`task.controller.ts`) |
| `TaskService`, `TaskActivityService` | **task.service.ts** |
| `taskRepository`, `taskReadRepository` | **task.repository.ts** |
| `Task`, `TaskAssignment`, `TaskActivity`, `TaskType`, `TaskMentionReceipt` | **task/schema** |
| `taskSyncEvents.js` | **sync/** event emit |
| `taskActivityPurgeWorker` | new **`tsc.maintenance`** cron |
| `validation/schemas/tasks.js` | **task/schema** |

**Reuse:** task CRUD, checklists, comments. **New:** activity feed, bug report, mention receipts, purge job.

### Legacy: `routes/scheduleRoutes.js`, `scheduleService`

| Legacy | Target |
|---|---|
| Schedule aggregation (tasks + calendar) | **calendar/** schedule view |

**New.**

---

## 6. Calendar & events

### Legacy: `routes/calendarRoutes.js`, `CalendarEvent`, `ArtistCalendarEvent`

| Legacy | Target |
|---|---|
| Calendar CRUD, seed, task-linked events | **calendar/** (`calendar.controller.ts`) |
| `musicCalendarSeedService` | **calendar/** seed job |
| `validation/schemas/calendar.js` | **calendar/dto** |

**Reuse:** calendar module exists. **New:** gamification hooks, email dispatch on event create, project-scoped filtering.

---

## 7. Finance, invoices, subscriptions

### Legacy: `routes/financeRoutes.js`, `financeController`, `FinanceDocument`

| Legacy | Target |
|---|---|
| Document upload/folders, stats | **finance/** + **media/** (R2) |
| Invoice submit/approve/reject | **invoices/** (`invoices.controller.ts`) |
| `usdInrRateService` | **finance/** FX helper |
| `validation/schemas/finance.js` | **finance/dto**, **invoices/dto** |

**Reuse:** expenses, invoices scaffolds. **New:** folder tree, bulk upload, disk sync, approval workflow.

### Legacy: `routes/subscriptionRoutes.js`, `Subscription`, `subscriptionReminderService`

| Legacy | Target |
|---|---|
| Subscription CRUD, USD/INR | **finance/** or **payment/** |

**New:** payment module exists but not CoreKnot parity.

---

## 8. Content, mail, newsletter, messaging

### Legacy: `domains/mail/` + `/api/mail`, `/api/campaigns`, `/api/ses`

| Legacy | Target |
|---|---|
| `templatesController`, `profilesController` | **messaging/** templates |
| `campaignsController`, `campaignApiController` | **messaging/** campaigns |
| `mailAnalyticsController`, `geoAnalyticsController` | **analytics/** mail metrics |
| `holysheetController`, `holySheetService` | **integrations/** Google Sheets |
| `audienceController` | **crm/** + **audience/** |
| `emailProcessor`, `mailService`, `mailDriver` | **messaging.service.ts** |
| `resendWebhookHandler` | **integrations/** + **data-exchange/webhook** |
| `Campaign`, `MailCampaign`, `MailTemplate`, `MailEvent`, `EmailLog`, `EmailProfile` | **messaging/** + **content/** schema |
| `validation/schemas/mail.js`, `campaigns.js` | **messaging/dto** |
| `queueService` campaign dispatch | new **`tsc.email`** queue |
| `backgroundQueue` (`holySheetQueue`, etc.) | **`tsc.email`**, **`tsc.integrations`** |

**Reuse:** messaging threads. **New:** full campaign engine, Resend/SES, holy sheet, mail rollups.

### Legacy: `routes/newsletterRoutes.js`, `NewsletterIssue`, `NewsletterArticle`, `NewsletterSubscriber`

| Legacy | Target |
|---|---|
| Newsletter curate/send | **content/** + **messaging/** |
| `newsletterWebhookService` | **integrations/** webhook |
| `validation/schemas/newsletter.js` | **content/dto** |

**New.**

---

## 9. Releases, distribution, media, marketplace

| Legacy | Target |
|---|---|
| `ArtistContentRelease`, `ArtistReleaseCampaign` | **releases/** + **content/** |
| Release/distribution ops (minimal in legacy) | **distribution/** (DistroKid adapter exists) |
| `routes/assetRoutes.js`, `officeAssetRoutes.js`, `Asset`, `OfficeAsset`, `ArtistAsset` | **media/** |
| `/api/uploadthing` | **media/** R2 upload |
| `routes/proxyRoutes.js` | **media/** CDN proxy or **integrations/** |
| Marketplace (minimal legacy) | **marketplace/** + **opportunity/** |

**Reuse:** releases, royalties, distribution, media scaffolds. **New:** UploadThing → R2 migration, office assets.

---

## 10. Analytics, dashboard, search, AI

### Legacy: `domains/dashboard/` + `/api/dashboard`, `/api/analytics`

| Legacy | Target |
|---|---|
| `dashboardController` (summary, dept-stats, attendance-overview) | **analytics/** dashboards |
| `dashboardMetricsController` | **analytics/** cumulative, location-leads |
| `analytics/comparisonEngine`, `sparklineService` | **analytics-domain.service.ts** |
| `analyticsService` | **analytics/** |
| `DashboardPreset`, customization routes | **profile/** or **workspace/** prefs |

**Reuse:** analytics compare/sparkline/cumulative stubs. **New:** dept stats, attendance overview, dashboard presets.

### Legacy: `routes/searchRoutes.js`, `UnifiedSearchService`, `unifiedSearchController`

| Legacy | Target |
|---|---|
| Unified search | **search/** + **typesense.service.ts** |

**Reuse:** search module. **New:** cross-entity unified index matching legacy scope.

### Legacy: AI (implicit in mail holysheet, CRM enrichment)

| Legacy | Target |
|---|---|
| Copy/generation helpers | **ai/** (`email-writer`, `pitch-writer`, `proposal-generator`) |

**Reuse:** ai module. **New:** wire to mail/CRM flows.

---

## 11. Integrations & webhooks

### Legacy: `domains/integrations/` + `/api/google`, `/api/exly`, `/api/integrations`, `/api/webhooks`

| Legacy | Target |
|---|---|
| `googleController`, `googleRoutes`, `googleAccountsRoutes` | **integrations/** Google OAuth |
| `exlyController`, `exlyRoutes`, `exlyService` | **integrations/** Exly + **inquiries/** |
| `integrationsVerifyController` | **integrations/** oauth-readiness |
| `metaDataDeletionController` | **integrations/** Meta compliance |
| `webhookController` (book-call, artist-path, enquiry, newsletter, masterclass) | **inquiries/** + **integrations/** + **data-exchange/** |
| `workers/webhookWorker` | **`tsc.integrations`** queue |
| `ExlyBooking`, `ExlyOffering`, `MetaDeletionRequest`, `BookedCall` | **integrations/** + **inquiries/** schema |

**Reuse:** integrations module. **New:** full OAuth flows, webhook workers, Exly metrics migration.

### Legacy: `routes/tscRoutes.js`, `TscData`

| Legacy | Target |
|---|---|
| TSC data import/stats | **data-exchange/** or **admin/** |

**New.**

### Legacy: Supabase sync (`workers/supabaseSyncWorker`, `services/supabase/*`)

| Legacy | Target |
|---|---|
| Mongo→Supabase mirror | **sync/** (replace with Prisma/Neon authority) |

**Deprecate** Supabase mirror; use **sync/** for external id mapping only.

---

## 12. Notifications, messaging, announcements

### Legacy: `routes/notificationRoutes.js`, `notificationService`, `pushNotificationService`

| Legacy | Target |
|---|---|
| Status counts, push subscribe | **notification/** |
| Cron: due-date + daily digest (`jobs/registry.js`) | **notification/** scheduler |
| `Notification` model | **notification/** schema |
| `validation/schemas/notifications.js` | **notification/dto** |

**Reuse:** notification module. **New:** push VAPID, task/lead/calendar aggregation.

### Legacy: `routes/announcementRoutes.js`, `Announcement`

| Legacy | Target |
|---|---|
| Org announcements | **messaging/** broadcast or **notification/** |

**New.**

---

## 13. Admin, audit, health, QA

### Legacy: admin routes + system health

| Legacy route | Target |
|---|---|
| `adminRolesRoutes`, `adminRolesService` | **admin/** roles |
| `adminScriptsRoutes` | **admin/** scripts |
| `queueAdminRoutes`, `queueAdminService` | **admin/** + queue registry |
| `systemHealthAdminRoutes`, `SystemHealthService` | **admin/** + **health/** |
| `supabaseAdminRoutes` | **deprecate** → **sync/** |
| `masterclassReviewAdminRoutes` | **admin/** content moderation |
| `gamificationAdminRoutes` | **rewards/** admin |
| `qaRoutes`, `qaTestingService` | dev-only; not prod domain |
| `routes/logRoutes.js`, `systemLogRoutes.js`, `SystemLog`, `Log` | **audit/** |
| `models/plugins/auditPlugin.js`, `CRMAudit`, `XPAuditLog` | **audit/** |
| `GET /api/health` | **health/** (`health.controller.ts`) |

**Reuse:** health, admin stubs, audit module. **New:** queue admin UI parity, system log archiver.

---

## 14. Misc legacy routes

| Legacy prefix | Target domain(s) | Notes |
|---|---|---|
| `/api/gamification` | **rewards/** | XP, missions, leaderboard |
| `/api/customization` | **profile/**, **workspace/** | Navbar/shortcut/dashboard presets |
| `/api/notes`, `/api/pinboard` | **content/** | UserNote, PinBoardNote |
| `/api/track` | **analytics/** | Email open/click tracking |
| `/api/public` | **public-api/** | Public endpoints |
| `/api/openapi.json` | Swagger at `/api/docs` | Already in API |

---

## Queue & event mapping

### Legacy queues (BullMQ / memory)

| Legacy queue/worker | Target queue | Domain |
|---|---|---|
| `domain-sync` | **sync/** ingest + new `tsc.sync` | Cross-domain hybrid sync |
| `webhook` | **`tsc.integrations`** | Webhook processing |
| `import` | **`tsc.import`** (new) | CRM/data imports |
| `log-archiver` | **`tsc.audit`** (new) | System log archive |
| `supabase-sync` | **deprecate** | Replace with Prisma |
| `holySheetQueue` | **`tsc.integrations`** | Google Sheets |
| `csvBackupQueue` | **`tsc.maintenance`** (new) | Backups |
| `gamificationQueue` | **`tsc.reputation`** or **`tsc.rewards`** | XP recalc |
| Campaign memory/`queueService` | **`tsc.email`** (new, P1 gap) | Mail send |
| `statsWorker` (cron) | **`tsc.analytics`** (new) | CRM stat snapshots |
| `taskActivityPurgeWorker` (cron) | **`tsc.maintenance`** | Task activity purge |
| `notificationService` (cron) | **`tsc.notification`** (new) | Reminders/digest |

### Existing API queues (`queue-registry.service.ts`)

- `tsc.feed`
- `tsc.reputation`
- `tsc.graph`
- `tsc.recommendation`

Legacy domain events (`taskSyncEvents.js`, `eventBus.js`, `eventDispatcher.js`) → **sync/** `POST /sync/events` + future `tsc.sync` producer.

---

## DTO pattern migration

| Legacy | Target |
|---|---|
| Joi in `validation/schemas/*.js` + `validateBody/Query/Params` | Zod in `*/schema`, `*/dto` + `parseSchema()` |
| `utils/apiResponse` (`apiOk`, `apiError`) | NestJS exceptions + standard response envelope |
| Multer file uploads in routes | NestJS `@UploadedFile()` + **media/** service |
| `middleware/authMiddleware` (`protect`, `admin`, page access) | `ClerkAuthGuard` + `RolesGuard` + `@Roles()` + `@Membership()` |
| Tenant context (`tenantContext.js`) | Organization scoping via membership context |

---

## Recommended migration phases

1. **P0 — Platform:** health, auth (Clerk), users, organizations, audit, admin  
2. **P1 — CoreKnot ops:** project, task, calendar, teams, crm, finance, invoices  
3. **P2 — Artist OS:** artist, gigs, inquiries, contracts, releases, royalties, integrations  
4. **P3 — Comms:** messaging (campaigns), notification, analytics, search, ai  
5. **P4 — Deprecate:** Supabase sync, legacy JWT auth, UploadThing → R2

---

## Key path references

- Route manifest: `c:\Projects\TSC Platform\apps\coreknot\server\app\registerRoutes.js`
- Domain folders: `c:\Projects\TSC Platform\apps\coreknot\server\domains\{auth,artists,crm,projects,tasks,mail,data-hub,dashboard,integrations,person}`
- Job registry: `c:\Projects\TSC Platform\apps\coreknot\server\jobs\registry.js`
- API modules: `c:\Projects\TSC Platform\apps\api\src\modules\`
- API queues: `c:\Projects\TSC Platform\apps\api\src\queues\queue-registry.service.ts`

---

**For parent:** Switch to Agent mode to write `docs/migration/03-domain-mapping.md` from this content, or copy verbatim. No code was modified.
