# API Contract Certificate (Agent 18)

> **Date:** 2026-06-15  
> **OpenAPI:** `apps/api/openapi/tsc-api.openapi.json` (415 paths)  
> **Build:** `pnpm --filter @tsc/api typecheck` → **PASS**  
> **Verdict:** **FAIL** — boundary violations, stub routes in spec, unauthenticated endpoints, CoreKnot dual API surface.

---

## Platform API (`api.theshakticollective.in`)

### OpenAPI health

| Check | Result |
|-------|--------|
| Spec file present | ✅ |
| Path count | 415 |
| Typecheck | ✅ 0 errors |
| Export on boot | Optional via `OPENAPI_EXPORT_ON_BOOT` |
| Swagger UI | `apps/api/src/swagger/swagger.setup.ts` |

### Controller coverage

~90 controller files under `apps/api/src/modules/`. Most authenticated modules use `@UseGuards(ClerkAuthGuard)` at controller level.

**Unauthenticated / alternate auth endpoints (intentional or gap):**

| Route prefix | Auth | File | Risk |
|--------------|------|------|------|
| `/api/health/*` | None | `health.controller.ts` | ✅ Expected |
| `/api/public/v1/*` | API key | `public-api.controller.ts` | ✅ Scoped |
| `/api/white-label/tenants/*` | **None** | `white-label.controller.ts` | ⚠️ Public by design — tenant config leak |
| `/api/graph/edge-types` | **None** | `graph.controller.ts` | 🟢 Low — metadata only |
| `/api/feed/health` | **None** | `feed.controller.ts` | Stub |
| `/api/posts/health` | **None** | `post.controller.ts` | Stub |

**No global auth guard** — `apps/api/src/main.ts` does not register `APP_GUARD`. Any new controller without `@UseGuards` is accidentally public.

### DTO / validation

| Pattern | Status |
|---------|--------|
| Zod via `parseSchema` | ✅ Widely used in new modules |
| `@tsc/contracts/*` schemas | ✅ Membership, discovery, etc. |
| Legacy inline types | ⚠️ Some compat controllers |
| `any` usage | ⚠️ Low in controllers; check services |

### Stub modules (contract exists, implementation minimal)

| Module | Endpoint | Response |
|--------|----------|----------|
| Feed | `GET /feed/health` | `{ status: 'stub' }` |
| Post | `GET /posts/health` | `{ status: 'stub' }` |
| Admin | `GET /admin/*` | Stub catalogs (queues, scripts) |

OpenAPI may still document fuller surfaces from earlier sprints — **verify spec matches runtime** before client codegen.

### API boundary violations

| Issue | Severity | Detail |
|-------|----------|--------|
| `CoreknotCompatModule` | P0 | Legacy CRM/project/task routes on **Platform API** — `apps/api/src/modules/coreknot-compat/` |
| Platform CRM/Tasks/Finance | P1 | Duplicate CoreKnot domain writes — see [COREKNOT-BOUNDARY.md](../architecture/COREKNOT-BOUNDARY.md) |
| `LegacyJwtService` in ClerkAuthGuard | P1 | Accepts CoreKnot JWT on Platform API when enabled |

Per architecture: Website/Community must **never** call CoreKnot API. Compat layer violates spirit of boundary even if temporary.

### Response shape consistency

New modules return `{ items, updatedAt }` or ISO date strings. Legacy alias controllers (`*-alias.controller.ts`) map to older CoreKnot client shapes — maintain until client migrates.

---

## CoreKnot API (`api.coreknot.in`)

### Route inventory

55 route files under `apps/coreknot/server/routes/` plus domain routers in `domains/*/routes.js`.

| Domain | Routes file | Store |
|--------|-------------|-------|
| CRM | `crmRoutes.js` → `domains/crm` | Mongo / Postgres flag |
| Projects | `projectRoutes.js` | Mongo / Postgres flag |
| Tasks | `taskRoutes.js` | Mongo / Postgres flag |
| Finance | `financeRoutes.js` | Mongo + GridFS |
| Attendance | `attendanceRoutes.js` | Mongo |
| Calendar | `calendarRoutes.js` | Mongo |
| Notifications | `notificationRoutes.js` | Mongo |
| Auth | `authRoutes.js` | Mongo + JWT |
| Mail | `mailRoutes.js` | Mongo |
| Automation | via intelligence routes | Mongo |

### Auth contract

- Bearer JWT signed with `JWT_SECRET` — **not Clerk** (gap vs target auth architecture).
- `requireMongo` middleware returns 503 when Mongo unavailable — **blocks prod without Atlas**.

### Health

- `GET /api/health` — liveness
- `GET /api/health/ready` — Postgres + optional Mongo probe

No published OpenAPI in repo root for CoreKnot (internal `openApiRoutes.js` exists).

---

## Cross-API contract risks

| Risk | Impact |
|------|--------|
| Same Prisma tables, two APIs | Write conflicts, divergent validation |
| ID format mismatch (ObjectId vs cuid) | `CkLegacy*` mapping required |
| Platform OpenAPI clients used for CoreKnot compat | Hidden coupling |

---

## Certification

| Criterion | Result |
|-----------|--------|
| Platform typecheck | ✅ |
| OpenAPI present | ✅ |
| No boundary violations | ❌ |
| No stub routes in prod contract | ❌ |
| CoreKnot auth aligned | ❌ |
| DTO validation on all write routes | ⚠️ |

**Agent 18 verdict: FAIL**
