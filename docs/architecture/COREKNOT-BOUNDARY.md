# CoreKnot Boundary

> CoreKnot = internal operations CRM. Everything here is **staff-facing**, not public member traffic.

## Target repository layout (tsc-coreknot)

```
tsc-coreknot/
├── client/          # Vite/React SPA (@tsc/coreknot-client)
├── server/          # Express API (@tsc/coreknot-server)
├── workers/         # → lives under server/workers/ today
├── shared/          # contracts, platform IDs (optional)
└── docs/            # CoreKnot-specific runbooks
```

**Current location:** `apps/coreknot/` inside `tsc-platform` monorepo.

## What belongs ONLY in CoreKnot

### Server (`apps/coreknot/server/`)

| Domain | Path pattern | Notes |
|--------|--------------|-------|
| CRM | `domains/crm/`, `routes/*crm*` | Leads, pipelines, assignments |
| Projects | `domains/projects/` | Workspaces, goals, outlets |
| Tasks | `domains/tasks/` | Assignees, reviews, checklists |
| Finance | `domains/finance/`, `models/FinanceDocument.js` | OCR, folders, expenses |
| Contracts | contract-related routes | Operations billing context |
| Invoicing | invoice import scripts, Basecamp sync | Not Platform marketplace payments |
| Attendance | attendance routes, office IP middleware | `OFFICE_IP_WHITELIST` |
| Mail campaigns | `domains/mail/` | BullMQ mail worker |
| Data Hub | sync services, person hub | Internal analytics |
| Integrations | Exly, Meta, Google OAuth (staff) | `domains/integrations/` |
| Gamification | XP, missions, config | Staff engagement |
| Newsletter | subscriber models, issues | Ops comms |
| System health | backup, QA probes | `services/SystemHealthService.js` |

### Workers (`apps/coreknot/server/workers/`)

- `startWorkers.js` — mail, import, stats, supabase sync (legacy)
- Requires `RUN_WORKERS=true` on Railway worker service
- Requires `REDIS_URL` in production

### Client (`apps/coreknot/client/`)

- All ERP pages: CRM, projects, tasks, finance, attendance, settings
- Proxies API calls to CoreKnot API host (`VITE_API_URL`)

## What must NOT live in CoreKnot (Platform owns)

| Domain | Owner | Why |
|--------|-------|-----|
| Community feed, posts | Platform API | Public social product |
| Memberships, rewards (fan) | Platform API | Member-facing |
| Marketplace listings (public) | Platform API | Discovery/commerce |
| Artist passport (public) | Platform API | Fan/artist identity surface |
| Event discovery (public) | Platform API | Community events |
| Audience OS graph (public) | Platform API | Fan intelligence for members |

## Violation: Platform API CoreKnot modules

`apps/api/src/app.module.ts` currently imports CoreKnot-domain modules:

- `CrmModule`, `InquiriesModule`, `ProjectModule`, `TaskModule`
- `GigsModule`, `InvoicesModule`, `FinanceModule`, `CalendarModule`
- `CoreknotCompatModule` — legacy route aliases

**Classification:** Transitional migration scaffolding. Target state:

1. CoreKnot Client calls **only** `api.coreknot.in`
2. Platform API removes CoreKnot modules after compat layer sunset
3. Shared tables (`Lead`, `Project`, `Task`) remain in Prisma but **write path** is CoreKnot API only

## Data store boundary

| Store | CoreKnot today | Target |
|-------|----------------|--------|
| MongoDB (Mongoose) | Primary (~90 models) | **REMOVE** — see [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md) |
| PostgreSQL (Prisma) | Opt-in per `COREKNOT_*_STORE` | **Primary** |
| Redis | BullMQ queues | Shared infra, CoreKnot-prefixed queues |
| GridFS | Backups, attachments | **REPLACE** with R2 |
| Supabase mirror | Legacy ops | **ARCHIVE** — Neon is canonical |

## Auth boundary

| App | Current | Target |
|-----|---------|--------|
| CoreKnot Client | JWT cookie (`JWT_SECRET`) | Clerk SSO for staff OR signed service tokens |
| CoreKnot API | JWT validation, Google OAuth staff | Clerk JWT + org membership |
| Platform | Clerk (+ stub dev) | Clerk only in prod |

CoreKnot must not issue tokens that Platform API accepts except via explicit `LegacyJwtService` bridge (sunset — see [AUTH-ARCHITECTURE.md](./AUTH-ARCHITECTURE.md)).

## API host

- **Production:** `https://api.coreknot.in`
- **Local:** `http://localhost:5000`
- **Not:** `api.theshakticollective.in` for CRM mutations

## Deployment boundary

| Component | Host | Config |
|-----------|------|--------|
| Client | Vercel | `apps/coreknot/client/vercel.json` |
| API | Railway | `apps/coreknot/server/railway.toml` |
| Workers | Railway (2nd service) | `RUN_WORKERS=true` |

**Legacy Render:** archived to `docs/archive/render.coreknot.legacy.yaml`. Railway is deploy authority.

## Cross-service integration points

| Integration | Direction | Config |
|-------------|-----------|--------|
| Website webhooks | Website → CoreKnot | `BOOK_CALL_WEBHOOK_SECRET`, etc. |
| Platform sync | Platform → CoreKnot | `COREKNOT_SYNC_URL` in Platform API |
| Passport proxy | CoreKnot → Platform | `TSC_API_URL` in CoreKnot server |

These are **server-to-server** only — never expose CoreKnot JWT to public frontends.
