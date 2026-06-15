# Auth validation report — V-002 / V-003

**Date:** 2026-06-14  
**Agent:** L3 — Auth Debug  
**Scope:** Unauthenticated HTTP probes on protected CoreKnot compat routes (`@tsc/api`, local only)  
**Environment:** `TSC_AUTH_STUB=true`, placeholder `CLERK_SECRET_KEY`, Neon `DATABASE_URL`

---

## Root cause

1. **Unauthenticated → 500:** `StubAuthGuard` silently authenticated every request via `TSC_STUB_USER_ID` env fallback when no `Authorization` / `X-Stub-User-Id` was present. Requests entered `MembershipContextService.resolve()`, which threw an unhandled Prisma error → Nest **500** instead of **401**.

2. **Stub header → 500:** When explicit stub credentials were sent but Postgres lacked `User` / `Person` / org rows, `resolve()` threw inside the guard → **500** instead of a client error.

---

## Code changes

| File | Change |
|------|--------|
| `apps/api/src/common/auth/stub-auth.guard.ts` | Require explicit stub credentials (`Bearer stub:<id>`, plain non-JWT bearer, or `X-Stub-User-Id`); `UnauthorizedException` when absent; catch resolve failures → `UnauthorizedException('Invalid or unprovisioned stub user')` |
| `apps/api/src/common/auth/clerk-auth.guard.ts` | Legacy JWT fallback; map non-auth verify errors to `UnauthorizedException` |
| `apps/api/src/common/auth/membership-context.service.ts` | Resolve via Prisma `User` / `OrganizationMember` (no silent person auto-create on auth) |

---

## HTTP status probes

### Before fix (API `:4000`, pre-change behavior)

| Route | Auth | Status | Body (truncated) |
|-------|------|--------|------------------|
| `GET /api/crm/leads` | none | **500** | `Internal server error` |
| `GET /api/projects` | none | **500** | `Internal server error` |
| `GET /api/tasks` | none | **500** | `Internal server error` |
| `GET /api/crm/leads` | `Authorization: Bearer invalid.jwt.token` | **500** | `Internal server error` |
| `GET /api/crm/leads` | `X-Stub-User-Id: user_dev_stub` | **500** | `Internal server error` |

### After fix (API `:4012`, `pnpm --filter @tsc/api build` → `node dist/main.js`)

| Route | Auth | Status | Body (truncated) |
|-------|------|--------|------------------|
| `GET /api/crm/leads` | none | **401** | `Authentication required` |
| `GET /api/projects` | none | **401** | `Authentication required` |
| `GET /api/tasks` | none | **401** | `Authentication required` |
| `GET /api/crm/leads` | `Authorization: Bearer invalid.jwt.token` | **401** | `Authentication required` |

### After fix — stub credentials (auth passes; harness / seed still pending)

| Route | Auth | Status | Notes |
|-------|------|--------|-------|
| `GET /api/crm/leads` | `X-Stub-User-Id: user_dev_stub` | **400** | Auth OK; domain `crm/leads` controller requires `organizationId` query |
| `GET /api/crm/leads` | `Authorization: Bearer stub:stub-user` | **400** | Same — seed org + route to legacy compat for **200** |
| `GET /api/crm/leads` | unprovisioned stub + missing `User` table | **401** | `Invalid or unprovisioned stub user` |

### After fix — non-stub mode (`TSC_AUTH_STUB=false`)

| Route | Auth | Status | Body (truncated) |
|-------|------|--------|------------------|
| `GET /api/crm/leads` | none | **401** | `Missing bearer token` |
| `GET /api/crm/leads` | `Authorization: Bearer invalid.jwt.token` | **401** | `Invalid or expired token` |

---

## Verification commands

```powershell
pnpm --filter @tsc/api typecheck
pnpm --filter @tsc/api build
$env:PORT=4012; node apps/api/dist/main.js

curl.exe -s -w "`nHTTP:%{http_code}" http://localhost:4012/api/crm/leads
curl.exe -s -w "`nHTTP:%{http_code}" http://localhost:4012/api/projects
curl.exe -s -w "`nHTTP:%{http_code}" http://localhost:4012/api/tasks
```

Expected unauthenticated: **401** on all three.

---


### V-002 verified — stub **200** (pnpm seed:dev-user, API :4000, 2026-06-14)

```powershell
pnpm seed:dev-user
pnpm dev:api
curl.exe -s -o NUL -w "HTTP:%{http_code}" -H "X-Stub-User-Id: user_dev_stub" "http://localhost:4000/api/crm/leads?organizationId=seed_org_dev_stub"
```

| Route | Auth | Status |
|-------|------|--------|
| GET /api/crm/leads?organizationId=seed_org_dev_stub | X-Stub-User-Id: user_dev_stub | **200** |

Also covered by pnpm test:migration:api-smoke domain probes (stub auth).

## Verdict

| Check | Result |
|-------|--------|
| Unauthenticated protected routes return **401** (not **500**) | **PASS** |
| Typecheck | **PASS** (`0` errors) |
| Stub-authenticated happy path (**200**) | **PASS** (V-002) |

**NO production changes.**
