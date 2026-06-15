# Security Certificate (Agent 14)

> **Date:** 2026-06-15  
> **Constitution:** [../architecture/AUTH-ARCHITECTURE.md](../architecture/AUTH-ARCHITECTURE.md), [../architecture/DATA-OWNERSHIP-MAP.md](../architecture/DATA-OWNERSHIP-MAP.md)

## Before state

| Area | Finding | Severity |
|------|---------|----------|
| `/admin/*` | `ClerkAuthGuard` only — any authenticated user | 🔴 Critical (C6) |
| `/audit/logs` | No org filter — global log leak | 🔴 Critical |
| `/audit/logs` POST | No role or org check | 🔴 Critical |
| `/analytics/*` | No org scope — cross-tenant metrics | 🔴 Critical |
| CRM/Finance/Teams | `RolesGuard` + `assertOrgRead` | ✅ |
| `@tsc/permissions` | RBAC helpers present | ✅ |
| `org-access.ts` | `requireOrganization`, assert read/manage | ✅ |
| Platform admin | `TSC_ADMIN_USER_IDS` env allowlist | ✅ (config-dependent) |
| Tenant isolation (workspace) | Workspace routes via CoreKnot compat — partial | 🟠 |

## After state

| Fix | File |
|-----|------|
| `@Roles('SUPER_ADMIN')` + `RolesGuard` on admin controller | `admin.controller.ts` |
| Org-scoped audit list; multi-org filter for members | `audit.service.ts`, `audit.repository.ts` |
| Audit record requires org manage or platform admin | `audit.service.ts` |
| `@Roles` on audit POST (ORG_OWNER, MANAGER, SUPER_ADMIN) | `audit.controller.ts` |
| Analytics org scope — non-admins require `organizationId` + membership | `analytics-domain.service.ts` |
| `RolesGuard` on analytics controller | `analytics.controller.ts` |

### RBAC coverage (post-fix)

| Route prefix | Guards | Org isolation |
|--------------|--------|---------------|
| `/admin` | Clerk + Roles (SUPER_ADMIN) | N/A |
| `/audit` | Clerk + Roles (POST) | ✅ list + record |
| `/analytics` | Clerk + Roles | ✅ query scope |
| `/crm`, `/finance`, `/teams` | Clerk + Roles | ✅ existing |
| `/users` | Clerk + SUPER_ADMIN | ✅ |

## Remaining gaps (not fixed this wave)

| Gap | Owner | Priority |
|-----|-------|----------|
| CoreKnot compat legacy controllers — org context via `CoreknotContextService` | Worker B / sunset | H1 |
| Workspace-level isolation (not org) | CoreKnot extraction | M5 |
| Clerk webhook signature verification | Agent 04 / founder | C4 |
| Rate limiting on auth endpoints | P2 hardening | Low |
| Audit log tamper-evidence (append-only DB policy) | Future | Low |

## Risk

| Risk | Mitigation |
|------|------------|
| Breaking CoreKnot compat clients on `/admin` | Routes were CoreKnot stubs; real admin uses env allowlist |
| Analytics clients omitting `organizationId` | Clear 403 with message; admins retain global access |
| Over-broad SUPER_ADMIN via env | Document `TSC_ADMIN_USER_IDS` in FOUNDER-TASKS |

## Rollback

Revert commits touching:

- `apps/api/src/modules/admin/admin.controller.ts`
- `apps/api/src/modules/audit/*`
- `apps/api/src/modules/analytics/*`

## Certification result

| Check | Result |
|-------|--------|
| C6 admin/audit/analytics scoped | ✅ FIXED |
| Stub disabled in production | ✅ PASS |
| Legacy JWT bridge default off | ✅ PASS |
| Org read/manage helpers used | ✅ PASS |
| Full tenant isolation | ⚠️ PARTIAL — workspace + compat routes remain |

### **Security: CONDITIONAL PASS**

Critical C6 gaps **closed** in scope. Full PASS requires CoreKnot compat sunset + Clerk webhooks + prod `TSC_ADMIN_USER_IDS` configured.
