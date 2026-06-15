# CoreKnot Legacy System Audit (Agent 1)

**Scope:** `apps/coreknot/server/`  
**Agent:** 1 — Legacy System Auditor  
**Date:** 2026-06-14  
**Origin:** Express/Mongo CRM cloned from Taskmaster; DB names `taskmaster_local` / `taskmaster_production`.

---

## Executive summary

| Metric | Count |
|--------|------:|
| **HTTP endpoints** | **~448** (incl. `router.route` chained methods + 2 `router.all` proxy patterns) |
| **API mount prefixes** | **37** (`API_DOMAINS` in `app/registerRoutes.js`) |
| **Route files** | **62** (`routes/` 51 + `domains/**/routes` 11) |
| **Mongo models (unique collections)** | **94** |
| **BullMQ queue names** | **6** (+ in-memory campaign queue fallback) |
| **node-cron jobs** | **5** registered + **2** `setInterval` (analytics, health) |
| **Middleware modules** | **9** |
| **Top-level services** | **~108** (`services/` + `domains/**/services`) |

**Route registration hub:** `c:\Projects\TSC Platform\apps\coreknot\server\app\registerRoutes.js`  
**Target stack (new):** Prisma/Neon — `packages/database/prisma/migrations/20250614000000_coreknot_domain_p1_p3/migration.sql` maps Lead, Inquiry, Gig, Expense, Release, Royalty, Organization, User (Clerk), etc.

---

## Render / legacy env patterns

Canonical checklists:
- `apps/coreknot/server/.env.render.example`
- `apps/coreknot/server/.env.example` (full list)
- `apps/coreknot/server/.env.production.example`

| Category | Key vars |
|----------|----------|
| **Core** | `NODE_ENV`, `PORT`, `MONGODB_URI`, `MONGODB_URI_PROD`, `MONGODB_DB_LOCAL` (`taskmaster_local`), `MONGODB_DB_PROD` (`taskmaster_production`) |
| **Auth** | `JWT_SECRET`, `ENCRYPTION_KEY`, `JWT_EXPIRES_IN`, `JWT_ABSOLUTE_MAX_DAYS`, `JWT_REFRESH_MINUTES`, `ADMIN_EMAIL`, `ALLOWED_DOMAIN` |
| **URLs** | `APP_BASE_URL`, `SERVER_URL`, `TRACKING_BASE_URL`, `FRONTEND_URL`, `CLIENT_URL`, `CORS_ALLOWED_ORIGINS` |
| **Redis** | `REDIS_URL` (Render Key Value; `noeviction` required for BullMQ) |
| **Backup** | `BACKUP_ENABLED`, `MONGODB_BACKUP_DB` (`taskmaster_backups`), `BACKUP_RETENTION_COUNT` |
| **Supabase mirror** | `SUPABASE_SECONDARY_ENABLED`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PG_MODE=rest` (Render IPv4) |
| **Observability** | `SENTRY_DSN`, `DD_*` |

**Note:** Platform target is Railway + Vercel + Neon (`.specify/MASTER.md`), not Render — Render docs are legacy from Taskmaster era.

---

## API routes (by mount prefix)

Auth tiers from `registerRoutes.js`: **public** | **auth** | **authenticated** (`protect`) | **admin** | **webhooks** (signature, no JWT).

### Public / health

```
Current Route: GET /api/health
Current Handler: inline — app/registerRoutes.js → services/SystemHealthService.js
Target Domain: platform/health

Current Route: GET /api/openapi.json
Current Handler: routes/openApiRoutes.js
Target Domain: platform/docs

Current Route: GET /api/public/masterclass-reviews
Current Handler: routes/publicRoutes.js
Target Domain: public/

Current Route: GET|POST /open/:pixelId.gif, /click/:clickId, /webhooks/resend, /unsubscribe (also under /api/track/*)
Current Handler: routes/track.js (mounted at root AND /api/track)
Target Domain: mail/tracking
```

### Auth — `domains/auth/routes.js` → `domains/auth/controllers/authController.js`

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/logout
POST   /api/auth/google-login
POST   /api/auth/oauth-establish
GET    /api/auth/google/redirect-uri
GET    /api/auth/google
GET    /api/auth/google/callback
GET    /api/auth/me
GET    /api/auth/realtime-token
GET    /api/auth/sessions
DELETE /api/auth/sessions/:jti
POST   /api/auth/sessions/revoke-others
POST   /api/auth/change-required-password
Target Domain: auth/
```

### Artist OAuth connect — `domains/artists/connectRoutes.js`

```
POST /api/auth/connect/:provider
GET  /api/auth/callback/:provider
Target Domain: artists/integrations
```

### Users — `domains/auth/userRoutes.js` → `domains/auth/controllers/userController.js`

```
GET    /api/users/team
GET    /api/users/sales-reps
GET    /api/users/artist-reps
PUT    /api/users/profile
GET    /api/users/directory
POST   /api/users/
GET    /api/users/:id/monthly-report
PUT    /api/users/:id/teams
PUT    /api/users/:id
DELETE /api/users/:id
Target Domain: auth/users
```

### Projects — `domains/projects/routes.js` → `domains/projects/controllers/*`

```
GET    /api/projects/workspaces-plain.txt (dev localhost only)
POST|GET /api/projects/
GET|POST|PUT /api/projects/workspaces
GET|PATCH|DELETE /api/projects/workspaces/:name
GET    /api/projects/analytics-summary
GET|PUT|PATCH|DELETE /api/projects/:id
POST   /api/projects/:id/members
PATCH  /api/projects/:id/members/:userId/role
PUT    /api/projects/:id/remove-member
GET    /api/projects/:id/workload|hours-summary|analytics|goals|goals/weekly|kra|kra/me
PUT    /api/projects/:id/goals
PUT    /api/projects/:id/kra/:userId
POST   /api/projects/:id/link-calendar
GET    /api/projects/:id/calendar-events
Target Domain: projects/
```

### Tasks — `domains/tasks/routes.js` → `domains/tasks/controllers/taskController.js`

```
POST   /api/tasks/bug
POST|GET /api/tasks/
GET|POST /api/tasks/:id/activity
GET|PUT|PATCH|DELETE /api/tasks/:id
Target Domain: tasks/
```

### CRM — `domains/crm/routes.js` → `domains/crm/controllers/crmController.js`, `artistCrmController.js`

```
POST   /api/crm/unsubscribe (registerRoutes inline)
GET    /api/crm/export
GET    /api/crm/purge-logs
DELETE /api/crm/imports/:id
POST   /api/crm/reset
GET    /api/crm/debug/columns
POST   /api/crm/debug/save-mapping
POST   /api/crm/sync-unsubscribed
GET    /api/crm/artist/templates
POST   /api/crm/artist/upload
POST   /api/crm/artist/import
DELETE /api/crm/leads/cleanup-test-data
GET    /api/crm/leads/audit-logs
DELETE /api/crm/leads/audit-logs/purge
POST   /api/crm/leads/upload
GET    /api/crm/stats|rep-summary|config|imports|import/status/:jobId|followups
GET|POST /api/crm/leads
GET|PUT|DELETE /api/crm/leads/:id
POST   /api/crm/leads/:id/notes|lock-heartbeat|unlock
GET|POST /api/crm/leads/:leadId/emis
PUT    /api/crm/emis/:id
GET    /api/crm/leads/:leadId/audit
Target Domain: crm/
```

### Artists (67 routes) — `domains/artists/routes.js` → multiple controllers

```
Public/webhook: GET|POST /api/artists/webhook/meta
GET  /api/artists/:id/preview
GET  /api/artists/public/:slug
POST /api/artists/public/:slug/inquiry
OAuth callbacks: spotify, youtube, meta
Protected: config, portfolio, CRUD, connections hub, members, OS (inquiries, gigs, finance, calendar, analytics, documents, contracts, notes, content, assets, releases) — 50+ routes
Handler files: domains/artists/controllers/{artist,artistAnalytics,artistShare,artistOs,artistMembership,artistWorkspace,connectionAuth,connectionHub}Controller.js
Target Domain: artists/
```

### Artists v2 — `domains/artists/v2Routes.js` (inline handlers)

```
GET /api/v2/artists/:id/stats
GET /api/v2/artists/shared/:sharedTokenId
Target Domain: artists/analytics
```

### Artist path — `domains/artists/pathRoutes.js` → `pathRoutes.handlers.js`

```
GET  /api/artist-path/people
GET  /api/artist-path/people/:personId
POST /api/artist-path/sync
Target Domain: artists/path
```

### Mail — `domains/mail/routes/index.js` (5 sub-routers)

| Sub-router | Prefix | Handler dir |
|------------|--------|-------------|
| templatesRouter | `/api/mail/templates*` | `domains/mail/controllers/templatesController.js` |
| profilesRouter | `/api/mail/profiles*` | `profilesController.js` |
| campaignsRouter | `/api/mail/campaigns*` | `campaignsController.js` |
| analyticsRouter | `/api/mail/stats`, tracking pixels | `analyticsController.js` |
| holysheetRouter | `/api/mail/holysheet`, `/audience/*` | `holysheetController.js`, `audienceController.js` |

### Campaigns API — `domains/mail/routes/campaignApiRouter.js` → `campaignApiController.js`

```
GET|POST /api/campaigns/
POST /api/campaigns/upload-attachment
GET  /api/campaigns/:id/recipients/export|recipients|:id
POST /api/campaigns/:id/dispatch|resend|resend-filtered|stop
DELETE /api/campaigns/:id
Target Domain: mail/campaigns
```

### Remaining mounts (`routes/*.js` unless noted)

| Prefix | File | Routes | Target |
|--------|------|-------:|--------|
| `/api/logs` | `logRoutes.js` | 8 | ops/logs |
| `/api/system-logs` | `systemLogRoutes.js` | 4 | observability |
| `/api/teams` | `teamRoutes.js` → `teamController.js` | 3 | org/teams |
| `/api/gamification` | `gamificationRoutes.js` | 5 | gamification |
| `/api/gamification-admin` | `gamificationAdminRoutes.js` | 5 | gamification/admin |
| `/api/qa` | `qaRoutes.js` → `qaTestingController.js` | 12 | qa |
| `/api/customization` | `customizationRoutes.js` → `customizationController.js` | 14 | workspace/ui |
| `/api/assets` | `assetRoutes.js` → `assetController.js` | 4 | assets |
| `/api/google` | `domains/integrations/googleRoutes.js` | 4 | integrations/google |
| `/api/google/accounts` | `googleAccountsRoutes.js` (inline) | 6 | integrations/google |
| `/api/proxy` | `proxyRoutes.js` → `proxyController.js` | 2 (`router.all`) | proxy |
| `/api/dashboard` | `domains/dashboard/routes.js` | 3 | dashboard |
| `/api/calendar` | `calendarRoutes.js` (inline) | 5 | calendar |
| `/api/departments` | `departmentRoutes.js` (inline) | 10 | org/departments |
| `/api/schedule` | `scheduleRoutes.js` → `scheduleService.js` | 1 | schedule |
| `/api/notifications` | `notificationRoutes.js` (inline) | 8 | notifications |
| `/api/notes` | `noteRoutes.js` → `noteController.js` | 5 | notes |
| `/api/search` | `searchRoutes.js` → `UnifiedSearchService` | 1 | search |
| `/api/pinboard` | `pinBoardRoutes.js` → `pinBoardController.js` | 4 | workspace |
| `/api/ses` | `sesRoutes.js` (inline) | 1 | mail/ses |
| `/api/tsc` | `tscRoutes.js` → `tscController.js` | 6 | data-hub/tsc |
| `/api/data-hub` | `domains/data-hub/routes.js` | 10 | data-hub |
| `/api/analytics` | `analyticsRoutes.js` | 5 | analytics |
| `/api/webhooks` | `webhookRoutes.js` → `webhookController.js` | 10 | webhooks |
| `/api/integrations` | `integrationsRoutes.js` | 1 | integrations |
| `/api/exly` | `exlyRoutes.js` → `exlyController.js` | 10 | integrations/exly |
| `/api/office-assets` | `officeAssetRoutes.js` (inline) | 4 | ops |
| `/api/subscriptions` | `subscriptionRoutes.js` | 5 | finance/subscriptions |
| `/api/org-accounts` | `orgAccountRoutes.js` | 6 | org |
| `/api/contacts` | `contactRoutes.js` (inline) | 4 | contacts |
| `/api/newsletter` | `newsletterRoutes.js` (inline) | 12 | newsletter |
| `/api/finance` | `financeRoutes.js` → `financeController.js` | 21 | finance |
| `/api/attendance` | `attendanceRoutes.js` (inline) | 11 | attendance |
| `/api/announcements` | `announcementRoutes.js` (inline) | 5 | announcements |
| `/api/admin/roles` | `adminRolesRoutes.js` → `adminRolesService.js` | 4 | admin |
| `/api/admin/scripts` | `adminScriptsRoutes.js` | 2 | admin |
| `/api/admin/supabase` | `supabaseAdminRoutes.js` | 1 | admin/supabase |
| `/api/admin/queues` | `queueAdminRoutes.js` → `queueAdminService.js` | 2 | admin/queues |
| `/api/admin/system-health` | `systemHealthAdminRoutes.js` | 1 | admin/health |
| `/api/admin` | `masterclassReviewAdminRoutes.js` | 1 | admin/reviews |
| `/api/uploadthing` | `config/uploadthing.js` (UploadThing handler) | dynamic | storage |

**Legacy shim files** in `routes/` (`authRoutes.js`, `crmRoutes.js`, `taskRoutes.js`, etc.) re-export domain routes — not separately mounted.

---

## Mongo collections / models (94)

Canonical definitions split between `models/` (platform/shared) and `domains/*/models/`.

### Auth / org / workspace

| Model | File | Collection (if custom) |
|-------|------|------------------------|
| User | `models/User.js` | `users` |
| Tenant | `models/Tenant.js` | `tenants` |
| Department | `models/Department.js` | `departments` |
| Team | `models/Team.js` | `teams` |
| Workspace | `models/Workspace.js` | `workspaces` |
| WorkspacePreference | `models/WorkspacePreference.js` | `workspacePreferences` |
| DashboardPreset | `models/DashboardPreset.js` | `dashboardPresets` |
| NavbarPreference | `models/NavbarPreference.js` | `navbarPreferences` |
| ShortcutPreference | `models/ShortcutPreference.js` | `shortcutPreferences` |
| PlatformSettings | `models/PlatformSettings.js` | `platformsettings` |
| OrgAccount | `models/OrgAccount.js` | `orgaccounts` |
| OfficeContact | `models/OfficeContact.js` | `officecontacts` |
| OfficeAsset | `models/OfficeAsset.js` | `officeassets` |
| UserNote | `models/UserNote.js` | `usernotes` |
| PinBoardNote | `models/PinBoardNote.js` | `pinboardnotes` |
| Announcement | `models/Announcement.js` | `announcements` |

### Projects / tasks

| Model | File |
|-------|------|
| Project, Phase, ProjectGoal, ProjectGoalSnapshot, ProjectKRA | `domains/projects/models/` |
| Task, TaskType, TaskAssignment, TaskActivity, TaskMentionReceipt | `domains/tasks/models/` |

### CRM

| Model | File |
|-------|------|
| Lead, EMI, CRMConfig, CRMImport, CRMAudit, CRMStatSnapshot | `domains/crm/models/` |

### Mail

| Model | File |
|-------|------|
| Campaign, MailCampaign, MailTemplate, EmailProfile, EmailLog, MailEvent | `domains/mail/models/` |

### Artists (22 models)

`Artist`, `ArtistAuth`, `ArtistMembership`, `ArtistConnection`, `ArtistMetrics`, `ArtistSocialProfile`, `ArtistInquiry`, `ArtistGig`, `ArtistFinanceEntry`, `ArtistCalendarEvent`, `ArtistContract`, `ArtistContentRelease`, `ArtistAsset`, `ArtistReleaseCampaign`, `ArtistTeamNote`, `ArtistActivityLog`, `ArtistAudienceSnapshot`, `ArtistPathResponse`, `ArtistRevenueSource` — all under `models/Artist*.js`

### Data hub / people

`Person`, `PersonIndex`, `PersonIdentifier`, `PersonSourceLink`, `PersonCommunicationProfile`, `PersonHubView`, `OutsourcedRecord`, `DataHubSyncState`, `TscData` (deprecated → OutsourcedRecord/BookedCall/NewsletterSubscriber)

### Integrations / webhooks

`BookedCall`, `ExlyBooking`, `ExlyOffering`, `NewsletterSubscriber`, `NewsletterIssue`, `NewsletterArticle`, `MasterclassReview`, `MetaDeletionRequest`

### Ops / observability

`Log`, `SystemLog`, `QATestRun`, `Notification` (deprecated — client-only inbox), `Attendance`, `LeaveRequest`, `CalendarEvent`, `Subscription`, `FinanceDocument`, `Asset`, `GamificationConfig`, `DailyMission`, `XPAuditLog`

**TTL cold-archive collections** (`utils/mongoColdArchiveTtl.js`): `systemlogs`, `logs`, `crmaudits`, `mailevents`, `qaTestRuns`, `taskactivities` (90d).

---

## Services (selected by domain)

| Domain | Key services (`apps/coreknot/server/`) |
|--------|----------------------------------------|
| **CRM** | `LeadService.js`, `FollowupService.js`, `followupCache.js`, `artistCrmImportService.js` |
| **Mail** | `domains/mail/services/mailService.js`, `mailDriver.js`, `campaignAudienceService.js`, `emailProcessor.js`, `queueService.js` |
| **Projects** | `domains/projects/services/projectGoalsService.js`, `projectAnalyticsService.js` |
| **Tasks** | `domains/tasks/services/TaskService.js`, `TaskActivityService.js`, `taskActivityPurgeService.js` |
| **Artists** | `analyticsService.js`, `connectionService.js`, `artistEnrichmentService.js`, `metaGraphService.js`, `spotifyTokenManager.js` |
| **Data hub** | `DataHubService.js`, `PersonHubBuilder.js`, `PersonIdentityService.js`, `sourceRecordService.js` |
| **Integrations** | `exlyService.js`, `holySheetService.js`, `databaseBackupService.js`, `csvBackupService.js` |
| **Platform** | `SystemHealthService.js`, `systemLogService.js`, `gamificationService.js`, `notificationService.js`, `UnifiedSearchService.js`, `backgroundQueue.js` |
| **Supabase mirror** | `services/supabase/*` (sync, mail rollups, log read store) |
| **Sync scaffold** | `services/sync/eventBus.js`, `handlers/routeSyncHandler.js` |

---

## Middleware (`middleware/`)

| File | Role |
|------|------|
| `authMiddleware.js` | JWT cookie/`Authorization`, `protect`, `admin`, `opsOrAdmin`, page/artist RBAC |
| `rateLimits.js` | API, auth, upload, search, webhook limiters |
| `traceMiddleware.js` | Request trace IDs |
| `loggerMiddleware.js` | System log on API calls |
| `errorMiddleware.js` | Global error handler |
| `webhookIdempotency.js` | Webhook dedup |
| `concurrencyMiddleware.js` | CRM lead edit locks (`checkLock`) |
| `asyncHandler.js` | Async wrapper |
| `perfMiddleware.js` | Perf headers |

App-level (`app/`): `cors.js`, `rateLimits.js`, `csp.js`, `createApp.js` (helmet, compression, mongo-sanitize, cookie-parser).

---

## Cron jobs & queues

### Registered cron (`jobs/registry.js` — 5)

| ID | Schedule | Module |
|----|----------|--------|
| stats-snapshot | `*/5 * * * *` | `workers/statsWorker.js` |
| task-activity-purge | `15 3 * * *` | `workers/taskActivityPurgeWorker.js` |
| notification-minute | `* * * * *` | `services/notificationService.js` |
| notification-daily | `30 18 * * *` | `services/notificationService.js` |
| supabase-sync | `15 */6 * * *` | `workers/supabaseSyncWorker.js` |

### Additional schedulers

- `services/backgroundQueue.js` — artist analytics `setInterval` (12h)
- `services/SystemHealthService.js` — dependency probe every 15s
- `services/triggerService.js` — Trigger.dev midnight job (if `CAMPAIGN_USE_TRIGGER=true`)
- Render cron scripts: `scripts/runDailyBackup.js`, `scripts/keepWarm.js` (referenced in `.env.example`)

### BullMQ queues (6 unique names)

| Queue | Worker file | Purpose |
|-------|-------------|---------|
| `holySheetQueue` | `services/backgroundQueue.js` | Batch CRM → Google Sheets sync |
| `csvBackupQueue` | `services/backgroundQueue.js` | Lead CSV backup |
| `gamificationQueue` | `services/backgroundQueue.js` | XP events |
| `WebhookQueue` | `workers/webhookWorker.js` | Async webhook processing |
| `CsvImportQueue` | `workers/importWorker.js` | CRM CSV import |
| `domain-sync` | `services/sync/eventBus.js` | Hybrid domain sync scaffold |

**Registry workers** (`jobs/registry.js`): webhook, import, log-archiver (no-op stub), supabase-sync (cron-only, not BullMQ consumer), domain-sync.

**Memory fallbacks:** `backgroundQueue.js` (no Redis), `queueService.js` (campaign email dispatch), `eventBus.js` (domain-sync).

---

## Auth

| Mechanism | Implementation |
|-----------|----------------|
| **JWT sessions** | `utils/authSession.js`, `utils/authCookie.js` — cookie `coreknot_token_v3` (+ legacy purge) |
| **Token revocation** | `utils/tokenRevocation.js` (Redis + memory) |
| **Session registry** | `utils/sessionRegistry.js` — list/revoke sessions |
| **Roles** | Department `pagePermissions` + slugs (`utils/departmentPermissions.js`) |
| **Guards** | `protect`, `admin`, `opsOrAdmin`, `requirePageAccess`, artist team/membership guards |
| **OAuth** | Google staff login (`authController`), Google accounts link, Spotify/YouTube/Meta artist OAuth |
| **Webhooks** | HMAC / `X-Webhook-Secret` (`utils/webhookAuth.js`) |
| **Dev bypass** | `DEBUG_BYPASS` + localhost only (disabled in production) |

**Target:** Clerk + `PlatformRole` enum in Prisma migration.

---

## File storage

| Backend | Usage | Files |
|---------|-------|-------|
| **UploadThing** | Images, docs, finance, mail templates | `config/uploadthing.js`, `POST /api/uploadthing`, `utils/uploadthingServer.js` |
| **Local disk** | CRM CSV upload (`uploads/`), campaign attachments (`uploads/campaign-attachments/`), finance docs | `domains/crm/routes.js`, `campaignApiRouter.js`, `financeRoutes.js` (multer) |
| **Mongo GridFS** | DB backups | `services/databaseBackupService.js` |
| **Supabase Storage** | Backup bucket `taskmaster-backups` | `config/supabase.js`, sync services |

---

## Third-party integrations

| Service | Env / usage |
|---------|-------------|
| **MongoDB Atlas** | `MONGODB_URI` / `MONGODB_URI_PROD` |
| **Redis** | BullMQ, token revocation, cache |
| **Resend** | Primary mail (`RESEND_API_KEY`) |
| **SendGrid / SMTP / Nodemailer** | Fallback (`mailDriver.js`) |
| **AWS SES** | `routes/sesRoutes.js` webhook |
| **Google** | OAuth, Calendar, Drive, Sheets (HolySheet service account), Indian holidays |
| **Meta/Instagram** | Artist analytics webhooks, data deletion |
| **Spotify / YouTube** | Artist OAuth + analytics |
| **Exly** | Bookings/offerings (`EXLY_API_KEY`, webhook) |
| **HolySheet** | CRM sheet sync (`HOLYSHEET_API_KEY`) |
| **Songstats** | `SONGSTATS_API_KEY` — v2 artist stats |
| **Supabase** | Secondary Postgres + storage mirror |
| **Sentry / Datadog** | Observability scaffolds |
| **UploadThing** | `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET` |
| **Trigger.dev** | Optional campaign worker (`TRIGGER_API_KEY`) |
| **Web Push** | `VAPID_*` keys |
| **Socket.IO** | Realtime (`testRealtime.js` script) |
| **Frankfurter API** | USD/INR rate (`usdInrRateService.js`) |

---

## Prisma migration target mapping (from `20250614000000_coreknot_domain_p1_p3`)

| Mongo (legacy) | Postgres target |
|----------------|-----------------|
| Lead | `Lead` |
| ArtistInquiry | `Inquiry` |
| ArtistGig | `Gig` |
| ArtistFinanceEntry / FinanceDocument | `Expense` |
| ArtistContentRelease / ArtistReleaseCampaign | `Release` |
| (royalties TBD) | `Royalty` |
| User + Tenant + Department | `User` (Clerk), `Organization`, `OrganizationMember` |
| Team | `OrganizationTeam` |

---

## Counts for parent agent

```
route_count:        ~448 HTTP endpoint registrations
api_prefix_count:   37
route_file_count:   62
collection_count:   94 Mongo models (unique collections)
queue_count:        6 BullMQ queues (+ memory campaign queue)
cron_count:         5 node-cron registered + 2 setInterval
middleware_count:   9
service_file_count: ~108
```
