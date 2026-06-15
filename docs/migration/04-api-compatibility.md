# 04 — CoreKnot API compatibility (Agent 5)

**Scope:** Legacy Express paths used by `apps/coreknot/client` (axios + React Query hooks) vs NestJS `apps/api`.  
**Date:** 2026-06-14  
**Sources:** [01-system-audit.md](./01-system-audit.md), [03-domain-mapping.md](./03-domain-mapping.md), `apps/coreknot/client/src/hooks/queries/*`, `apps/coreknot/client/src/lib/*Api.js`, `apps/api/src/modules/coreknot-compat/*`.

---

## Executive summary

| Layer | Legacy (Express) | Target (Nest) | Compat status |
|-------|------------------|---------------|---------------|
| CRM proxy | `/api/crm/*` | `/api/crm/leads` (Prisma) | **P0 adapters shipped** |
| Projects | `/api/projects/*` | `/api/workspace/:slug/projects` | **P0 adapters shipped** |
| Tasks | `/api/tasks/*` | `/api/workspace/:slug/tasks` | **P0 adapters shipped** |
| TSC platform APIs | N/A (new client) | `/api/deals`, `/api/workspace`, etc. | **Native — no adapter** |

**Adapter module:** `apps/api/src/modules/coreknot-compat/`  
Registers flat legacy controllers that delegate to Nest services and reshape responses (`_id`, `{ leads }`, array project list).

**Auth:** Legacy JWT cookie flows remain client-side until Clerk cutover. Adapters use `ClerkAuthGuard` + `@Membership()` — same as native Nest routes.

**Context resolution:** `CoreknotContextService` picks first `organizationMemberships[].organizationId` (or `COREKNOT_DEFAULT_ORG_ID`) and default workspace via `GET /api/workspace/me` logic.

---

## Client call surfaces

### A — Legacy axios (CRM / ops UI) — **needs adapters**

Used directly in pages and `hooks/queries/*.js`:

| Prefix | Primary files |
|--------|---------------|
| `/api/crm` | `hooks/queries/crm.js`, `pages/crm/*`, `lib/navPrefetch.js` |
| `/api/projects` | `hooks/queries/projects.js`, `hooks/queries/schedule.js`, `pages/projects/*` |
| `/api/tasks` | `hooks/queries/tasks.js`, `pages/todo/*`, `lib/setupAxiosInterceptors.js` |
| `/api/calendar` | `hooks/queries/calendar.js` |
| `/api/finance` | `pages/finance/FinancePage.jsx` |
| `/api/mail`, `/api/campaigns` | `hooks/queries/mail.js` |
| `/api/dashboard` | `hooks/queries/dashboard.js`, `lib/navPrefetch.js` |
| `/api/notifications` | `hooks/useStatusCounts.js`, `utils/notifications.js` |
| `/api/auth`, `/api/users`, `/api/teams` | Auth/settings/admin pages |
| `/api/search` | `hooks/useUnifiedSearch.js` |

### B — TSC platform `*Api.js` (native Nest paths) — **no adapter**

| Module file | Nest prefix | Notes |
|-------------|-------------|-------|
| `workspaceApi.js` | `/api/workspace` | Native |
| `projectApi.js` | `/api/workspace/:slug/projects` | Native (slug-scoped) |
| `taskApi.js` | `/api/workspace/:slug/tasks` | Native |
| `dealApi.js`, `contractApi.js`, … | Matching module controllers | Already aligned |

CoreKnot client runs **both** layers during migration: ops pages → legacy paths; new Artist OS surfaces → native paths.

---

## P0 endpoint diff matrix (implemented adapters)

### CRM — `CrmLegacyController` → `CrmService`

| Legacy route | Method | Nest native | Adapter | Response shape |
|--------------|--------|-------------|---------|----------------|
| `/api/crm/leads` | GET | `GET /api/crm/leads?organizationId=` | **Yes** | `{ leads[], total, page, limit }` + `_id` |
| `/api/crm/leads` | POST | `POST /api/crm/leads` | **Yes** | Lead doc with `_id` |
| `/api/crm/leads/:id` | GET | — (added `getLeadById`) | **Yes** | Lead doc |
| `/api/crm/leads/:id` | PUT | — (added `updateLead`) | **Yes** | Lead doc |
| `/api/crm/leads/:id` | DELETE | — (added `deleteLead`) | **Yes** | `{ message }` |
| `/api/crm/leads/:id/notes` | POST | maps to `notes` field | **Yes** | Lead doc |
| `/api/crm/leads/:id/lock-heartbeat` | POST | no-op | **Yes** | 204 |
| `/api/crm/leads/:id/unlock` | POST | no-op | **Yes** | 204 |
| `/api/crm/leads/:id/audit` | GET | — | **Stub** | `{ entries: [] }` |
| `/api/crm/leads/audit-logs` | GET | `GET /api/audit/logs` | **Stub** | `{ logs: [], total: 0 }` |
| `/api/crm/stats` | GET | — | **Stub** | Empty stats object |
| `/api/crm/config` | GET | — | **Stub** | Empty config |
| `/api/crm/imports` | GET | — | **Stub** | `{ imports: [] }` |
| `/api/crm/rep-summary` | GET | — | **Stub** | `{ reps: [] }` |
| `/api/crm/followups` | GET | — | **Stub** | `{ leads: [] }` |
| `/api/crm/unsubscribe` | POST | — | **Stub** | `{ ok: true }` |

**Not in P0:** export, reset, EMI, import upload, artist CRM, holy-sheet sync (~25 legacy CRM routes).

### Projects — `ProjectsLegacyController` → `ProjectService`

| Legacy route | Method | Nest native | Adapter | Notes |
|--------------|--------|-------------|---------|-------|
| `/api/projects` | GET | `GET /api/workspace/:slug/projects` | **Yes** | Returns **array** (not `{ items }`) |
| `/api/projects` | POST | `POST /api/workspace/:slug/projects` | **Yes** | Uses default workspace slug |
| `/api/projects/:id` | GET | slug-scoped get | **Yes** | By Prisma `id`, maps `_id` |
| `/api/projects/:id` | PUT | slug-scoped patch | **Yes** | Resolves slug from default workspace |
| `/api/projects/workspaces` | GET | — | **Stub** | Default TSC workspace list |
| `/api/projects/workspaces` | POST/PUT | — | **Stub** | Accepts body, returns shape |
| `/api/projects/workspaces/:name` | GET/DELETE | — | **Stub** | |
| `/api/projects/analytics-summary` | GET | — | **Stub** | |
| `/api/projects/:id/analytics` | GET | — | **Stub** | |
| `/api/projects/:id/workload` | GET | — | **Stub** | |
| `/api/projects/:id/hours-summary` | GET | — | **Stub** | |
| `/api/projects/:id/remove-member` | PUT | member APIs | **Stub** | `{ ok: true }` |

**Not in P0:** members, goals, KRA, calendar link (~15 legacy project routes).

### Tasks — `TasksLegacyController` → `TaskService`

| Legacy route | Method | Nest native | Adapter | Notes |
|--------------|--------|-------------|---------|-------|
| `/api/tasks` | GET | `GET /api/workspace/:slug/tasks` | **Yes** | Array or `{ tasks }` when `scope=todo` |
| `/api/tasks` | POST | `POST /api/workspace/:slug/tasks` | **Yes** | |
| `/api/tasks/bug` | POST | create with high priority | **Yes** | |
| `/api/tasks/:id` | GET/PUT/DELETE | slug-scoped CRUD | **Yes** | `_id` mapped |
| `/api/tasks/:id/activity` | GET/POST | comments | **Partial** | GET `[]`; POST → comment |

**Not in P0:** scope filters (`dashboard`, `review`), mention receipts, activity purge.

---

## P1+ diff matrix (not implemented)

| Legacy prefix | Client usage | Target module | Priority |
|---------------|--------------|---------------|----------|
| `/api/calendar` | CalendarView, schedule | `calendar/` | P1 |
| `/api/schedule` | schedule.js | `calendar/` schedule view | P1 |
| `/api/finance` | FinancePage | `finance/` + `invoices/` | P1 |
| `/api/mail`, `/api/campaigns` | mail.js, campaign pages | `messaging/` | P1 |
| `/api/dashboard` | dashboard.js, navPrefetch | `analytics/` | P1 |
| `/api/notifications` | status counts, push | `notification/` | P1 |
| `/api/users`, `/api/teams`, `/api/departments` | admin, settings | `users/`, `teams/`, `organizations/` | P0 auth cutover |
| `/api/auth/*` | login, sessions, OAuth | Clerk (deprecate) | Founder task |
| `/api/artists/*` | Artist OS pages | `artist/` + related | P2 |
| `/api/search` | useUnifiedSearch | `search/` | P2 |

---

## Response shape mapping

| Concern | Legacy | Nest native | Adapter action |
|---------|--------|-------------|----------------|
| Mongo IDs | `_id` | `id` (cuid) | Emit both `_id` and `id` |
| CRM list | `{ leads, total, page }` | `{ items, organizationId }` | Wrap + rename |
| Project list | `Project[]` | `{ items, workspaceSlug }` | Flatten to array |
| Task list | `Task[]` or `{ tasks }` | `{ items }` or board | Scope-aware mapping |
| Lead stages | `leadStatus` string | `stage` enum | Map both fields |
| Auth | JWT cookie | Clerk bearer | Client unchanged until auth migration |

Client interceptors (`setupAxiosInterceptors.js`) still normalize `/api/projects`, `/api/tasks`, `/api/finance`, `/api/schedule` — adapters must return shapes those normalizers expect.

---

## Files added/changed

| Path | Change |
|------|--------|
| `apps/api/src/modules/coreknot-compat/coreknot-compat.module.ts` | New module |
| `apps/api/src/modules/coreknot-compat/crm-legacy.controller.ts` | CRM adapter |
| `apps/api/src/modules/coreknot-compat/projects-legacy.controller.ts` | Projects adapter |
| `apps/api/src/modules/coreknot-compat/tasks-legacy.controller.ts` | Tasks adapter |
| `apps/api/src/modules/coreknot-compat/coreknot-context.service.ts` | Org + workspace resolution |
| `apps/api/src/modules/coreknot-compat/coreknot-compat.mappers.ts` | Legacy DTO mappers |
| `apps/api/src/modules/crm/crm.service.ts` | `getLeadById`, `updateLead`, `deleteLead` |
| `apps/api/src/modules/project/project.repository.ts` | `findById` |
| `apps/api/src/app.module.ts` | Import `CoreknotCompatModule` |

---

## Verification

```powershell
pnpm --filter @tsc/api typecheck
```

Manual smoke (after API + Clerk env):

- `GET /api/crm/leads` → `{ leads: [...] }`
- `GET /api/projects` → `[...]`
- `GET /api/tasks?scope=todo` → `{ tasks: [...] }`

---

## Risks / follow-ups

1. **Organization scoping** — legacy CRM had tenant/rep scope; adapter uses first org membership only.
2. **Workspace grouping** — legacy `projects.workspaces` (TSC ACADEMY, etc.) are stubs; real data lives under Prisma `Workspace`.
3. **Stats/config stubs** — CRM dashboard widgets show zeros until P1 analytics wiring.
4. **Auth** — legacy login routes still hit Express until founder Clerk cutover; adapters assume Clerk session on Nest.
5. **Route registration order** — static segments (`workspaces`, `analytics-summary`) declared before `:id` param routes.

---

## Related

- [03-domain-mapping.md](./03-domain-mapping.md) — module reuse matrix
- [01-system-audit.md](./01-system-audit.md) — full legacy route inventory (~448 endpoints)
- Existing alias pattern: `booking-alias.controller.ts`, `tsc-identity-alias.controller.ts`
