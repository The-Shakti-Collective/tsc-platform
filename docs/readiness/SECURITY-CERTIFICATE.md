# Security Certificate (Agent 19)

> **Date:** 2026-06-15  
> **Verdict:** **FAIL** — tenant isolation partially implemented; admin RBAC gaps; legacy auth bridge; no global rate limiting.

Cross-reference: [AUTH-ARCHITECTURE.md](../architecture/AUTH-ARCHITECTURE.md) · [TECH-DEBT-ROADMAP.md](../architecture/TECH-DEBT-ROADMAP.md) C6

---

## Authentication

### Platform API

| Control | Status | File |
|---------|--------|------|
| Clerk JWT verification | ✅ | `clerk-auth.guard.ts` — `@clerk/backend` `verifyToken` |
| Dev stub auth | ⚠️ | `stub-auth.guard.ts` — must be **disabled in prod** (`AUTH_STUB=false`) |
| Legacy JWT bridge | ❌ | `legacy-jwt.service.ts` — CoreKnot session tokens accepted when `LEGACY_JWT_BRIDGE_ENABLED=true` |
| Membership resolution | ✅ | `membership-context.service.ts` → `@tsc/permissions` context |
| Global guard | ❌ | No `APP_GUARD` — per-controller only |

### CoreKnot API

| Control | Status |
|---------|--------|
| JWT (`JWT_SECRET`) | ✅ Active — **not Clerk** |
| Mongo session store | ⚠️ Legacy |
| `requireMongo` gate | ✅ Fails closed when DB down |

---

## Authorization (RBAC)

### Platform roles

| Component | Status |
|-----------|--------|
| `RolesGuard` + `@Roles()` | ✅ Implemented — `roles.guard.ts`, `roles.decorator.ts` |
| `@tsc/permissions` | ✅ `hasPlatformRole`, `canAccessOrganization`, `canManageOrganization` |
| Org-scoped services | ✅ `org-access.ts` used in CRM, finance, inquiries |
| Workspace isolation | ✅ `workspace-context.service.ts` — `requireMemberAccess`, `requireManageAccess` |

### Gaps (logical test: can user A access user B's data?)

| Scenario | Result | Detail |
|----------|--------|--------|
| Community user reads another org's leads | ✅ Blocked | `assertOrgRead` in `crm.service.ts` |
| Non-member reads workspace tasks | ✅ Blocked | `requireMemberAccess` |
| Any authenticated user hits `/admin/*` | ❌ **Allowed** | `admin.controller.ts` — ClerkAuthGuard only, **no RolesGuard** |
| Any authenticated user hits `/audit` | ⚠️ | ClerkAuthGuard only — verify service-level checks |
| Any authenticated user hits `/analytics` | ⚠️ | Same pattern |
| Artist A lists Artist B invoices | ✅ Blocked | `invoices.service.ts` filters by `ctx.artistMemberships` |
| Public white-label tenant enum | ⚠️ | Unauthenticated — by design, limit sensitive fields |
| API key scope bypass | ✅ | `ApiKeyAuthGuard` + `@RequireApiScope` |

**P0:** Add `@Roles('admin')` or equivalent to admin, audit, analytics controllers.

---

## Tenant / workspace isolation

| Layer | Mechanism | Gap |
|-------|-----------|-----|
| Organization | `canAccessOrganization(membership, orgId)` | Workspace not linked to org |
| Workspace | Slug + membership table | No org-level workspace list guard |
| CoreKnot | Mongo tenant plugin | Postgres path uses `CkLegacyTenant` mapping |

**Cross-tenant risk:** Platform API writing CoreKnot ops data without CoreKnot tenant context if compat routes used incorrectly.

---

## Input validation

| Layer | Status |
|-------|--------|
| Zod schemas | ✅ Most new endpoints |
| NestJS pipes | ⚠️ Inconsistent on legacy routes |
| Prisma parameterized queries | ✅ |
| File upload (R2) | ⚠️ Scaffold — verify MIME/size limits in `media.controller.ts` |

---

## Rate limiting

| Surface | Status |
|---------|--------|
| Public API keys | ✅ Stub in-memory — `api-key-rate-limit.service.ts` |
| Authenticated Platform API | ❌ **None** |
| CoreKnot API | ❌ Not found in sampled routes |
| Website contact | ❌ No rate limit on `/api/contact` |

---

## Secrets handling

| Check | Status |
|-------|--------|
| `.env.example` templates | ✅ `.env.platform.example`, `.env.coreknot.example` |
| Secrets in git | ✅ `.gitignore` covers `.env` |
| Clerk secret server-only | ✅ `requireClerkSecretKey()` |
| JWT secrets in CoreKnot | ⚠️ Single `JWT_SECRET` — rotation not documented |

---

## Security findings summary

| ID | Severity | Finding |
|----|----------|---------|
| SEC-1 | P0 | Admin/audit/analytics lack role guards |
| SEC-2 | P0 | Legacy JWT bridge on Platform API |
| SEC-3 | P0 | AUTH_STUB must be verified false in prod |
| SEC-4 | P1 | No rate limiting on authenticated API |
| SEC-5 | P1 | CoreKnot JWT vs Clerk dual identity |
| SEC-6 | P1 | Unauthenticated white-label endpoints — audit response fields |
| SEC-7 | P2 | No global auth guard — footgun for new controllers |

---

## Certification

| Criterion | Result |
|-----------|--------|
| Auth boundary failures | ❌ Legacy JWT |
| Tenant isolation failures | ⚠️ Partial |
| Critical security findings | ❌ Admin RBAC |
| Rate limiting | ❌ |

**Agent 19 verdict: FAIL**
