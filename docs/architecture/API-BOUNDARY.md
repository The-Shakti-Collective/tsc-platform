# API Boundary

> Two production API hosts. No ambiguity about which client calls which backend.

## Production hosts

| Host | Stack | Serves |
|------|-------|--------|
| `https://api.theshakticollective.in` | NestJS (`apps/api`) | Platform domains |
| `https://api.coreknot.in` | Express (`apps/coreknot/server`) | CoreKnot operations |

Local equivalents: `:4000/api` and `:5000/api`.

## Platform API scope (`api.theshakticollective.in`)

**Prefix:** `/api` (configurable via `API_GLOBAL_PREFIX`)

### Owns (authoritative)

| Domain | Module prefix | Examples |
|--------|---------------|----------|
| Community | `/community`, `/feed`, `/post` | Feed, posts, members |
| Memberships | `/membership` | Tiers, subscriptions |
| Rewards | `/rewards` | Points, redemptions |
| Events | `/event` | Public events, RSVP |
| Marketplace | `/marketplace` | Listings |
| Audience OS | `/audience`, `/audience-os`, `/fan` | Fan intelligence |
| Artist / Passport | `/artist`, `/passport` | Public artist profiles |
| Graph | `/graph`, `/relationship` | Entity graph |
| Search | `/search` | Typesense proxy |
| Identity | `/identity`, `/tsc-identity` | Member identity |
| Organizations (member) | `/organizations`, `/teams` | Member org context |
| Notifications (member) | `/notification` | Push/in-app |
| Public API | `/public-api` | API keys, partners |
| Health | `/health`, `/health/live`, `/health/ready` | Probes |

### Transitional (sunset — do not extend)

| Domain | Module | Notes |
|--------|--------|-------|
| CRM compat | `/crm`, `coreknot-compat/*` | Legacy route shapes |
| Projects/Tasks | `/project`, `/task` | Duplicates CoreKnot |
| Invoices/Finance | `/invoices`, `/finance` | Ops domains |
| Gigs, Calendar | `/gigs`, `/calendar` | Ops domains |

OpenAPI: `apps/api/openapi/tsc-api.openapi.json` · Swagger UI `/api/docs`

## CoreKnot API scope (`api.coreknot.in`)

**Prefix:** `/api`

### Owns (authoritative)

| Domain | Route area | Notes |
|--------|------------|-------|
| CRM | `/api/crm`, `/api/leads` | Lead pipeline |
| Projects | `/api/projects` | Workspaces, outlets |
| Tasks | `/api/tasks` | Assignments, reviews |
| Finance | `/api/finance` | Documents, OCR |
| Invoices | `/api/invoices` | Import, sync |
| Attendance | `/api/attendance` | Office IP, leave |
| Mail | `/api/mail`, `/api/campaigns` | Campaign dispatch |
| Integrations | `/api/integrations` | OAuth, webhooks |
| Auth (staff) | `/api/auth` | Login, refresh, Google |
| Health | `/api/health`, `/api/health/ready` | Mongo + Postgres readiness |
| Webhooks (inbound) | `/api/webhooks/*` | Website, Exly, Resend |
| Admin/QA | `/api/admin`, QA scripts | Internal only |

## Client routing rules

| Client | API URL env var | Must call |
|--------|-----------------|-----------|
| TSC Community | `NEXT_PUBLIC_API_URL` | Platform API only |
| TSC Website | `NEXT_PUBLIC_TSC_API_URL` | Platform API only |
| CoreKnot Client | `VITE_API_URL` | CoreKnot API only |

**Forbidden:** Setting Community `NEXT_PUBLIC_API_URL` to CoreKnot host.

## Cross-service call matrix

| Caller | Callee | Allowed | Auth |
|--------|--------|---------|------|
| Website | CoreKnot API | ✅ Webhooks only | Shared secrets |
| Website | Platform API | ✅ | Public / Clerk |
| Community | Platform API | ✅ | Clerk Bearer |
| Community | CoreKnot API | ❌ | — |
| CoreKnot Client | CoreKnot API | ✅ | JWT / Clerk |
| CoreKnot Client | Platform API | ❌ (except public reads if explicitly proxied server-side) | — |
| Platform API | CoreKnot API | ✅ Sync/outbound | `COREKNOT_SYNC_SECRET` |
| CoreKnot API | Platform API | ✅ Read proxy | `TSC_API_URL` server-side |
| External SaaS | Either | ✅ Webhook routes only | HMAC / secrets |

## CORS

| API | Origins |
|-----|---------|
| Platform | `CORS_ORIGIN` — Community, Website, CoreKnot client dev ports |
| CoreKnot | `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, Vercel previews flag |

## Rate limiting & versioning

- Platform: version via OpenAPI export; breaking changes require compat module or version prefix
- CoreKnot: implicit v1 in routes; `_id` Mongo shapes being replaced with cuid — clients must handle transition

## Health checks (deploy probes)

| Service | Liveness | Readiness |
|---------|----------|-----------|
| Platform API | `GET /api/health/live` | `GET /api/health/ready` (Postgres + Redis) |
| CoreKnot API | `GET /api/health` | `GET /api/health/ready` (Postgres + optional Mongo) |

**Note:** CoreKnot readiness still checks Mongo during parallel-run — remove Mongo check when `COREKNOT_MONGO_REQUIRED=false`.

## Gap: unified API cannot replace CoreKnot yet

Production readiness audit (2026-06-15) found:

- Auth contract mismatch (JWT vs Clerk)
- Finance GridFS attachments not in Platform API
- Mongo `_id` vs cuid in compat responses
- Worker queues only on CoreKnot server

**Do not decommission CoreKnot API** until [MONGO-SUNSET-REPORT.md](./MONGO-SUNSET-REPORT.md) exit criteria met.
