# Architecture Compliance Report (Agent 01)

> **Date:** 2026-06-15  
> **Constitution:** [MASTER-PRODUCTION-ARCHITECTURE.md](../architecture/MASTER-PRODUCTION-ARCHITECTURE.md)  
> **Verdict:** **PARTIAL PASS** — frontends compliant; Platform API still hosts transitional CoreKnot ops modules.

---

## Before state

| Area | Finding |
|------|---------|
| Website → API | Uses `NEXT_PUBLIC_API_URL` → Platform API (`public-api.ts`, default `:4000/api`) |
| Community → API | Uses `getApiBaseUrl()` → Platform API via `@tsc/community-sdk` |
| Website/Community imports | **No** `@tsc/coreknot*`, `apps/coreknot`, or CoreKnot API URLs in source |
| Platform API → CoreKnot code | **No** runtime imports from `apps/coreknot/` |
| Platform API modules | 16 CoreKnot ops modules + `CoreknotCompatModule` registered in `app.module.ts` |
| Compat layer | Legacy CRM/project/task/campaign routes exposed on Platform API without prod gate |
| Legacy JWT bridge | `LegacyJwtService` in `ClerkAuthGuard` — defaults **off** (`COREKNOT_JWT_BRIDGE=false`) |
| Community data | Mock data in dashboard, opportunities, profile, landing (`@/lib/mock-data`) |

## After state

| Change | Location |
|--------|----------|
| `PLATFORM_COREKNOT_COMPAT_ENABLED` config | `apps/api/src/common/config/platform-boundary.config.ts` |
| `CoreknotCompatGuard` on legacy controllers | `apps/api/src/modules/coreknot-compat/*-legacy.controller.ts` |
| Default compat **off in production** | `isPlatformCoreknotCompatEnabled()` |
| Frontend API URL boundary check | `apps/community/src/lib/platform-api-url.ts`, `apps/website/src/lib/api/platform-api-url.ts` |
| Env documentation | `apps/api/.env.example`, `apps/community/.env.example`, `apps/website/.env.example` |
| CRM module sunset marker | `apps/api/src/modules/crm/crm.module.ts` |

## Compliance matrix

| Rule | Website | Community | Platform API |
|------|---------|-----------|--------------|
| Calls Platform API only | ✅ | ✅ | N/A |
| Never calls CoreKnot API | ✅ (+ runtime guard) | ✅ (+ runtime guard) | N/A |
| No CoreKnot package imports | ✅ | ✅ | ✅ |
| No Mongo dependency | ✅ | ✅ | ✅ |
| Owns Platform domains only | N/A | N/A | 🟡 Transitional ops modules remain |
| Compat routes gated in prod | N/A | N/A | ✅ |

## Cross-import audit

```
apps/community  →  @tsc/community-sdk, @tsc/types  (Platform packages only)
apps/website    →  @tsc/types  (Platform packages only)
apps/api        →  @tsc/*, NestJS, Prisma  (no apps/coreknot imports)
```

**Note:** `coreknot_user` identifier provider in `person-id.ts` is a **Prisma identity enum value**, not a CoreKnot API call. Canonical per `packages/database/src/identity.ts`.

## Risk

| Risk | Severity | Mitigation |
|------|----------|------------|
| CoreKnot client still pointed at Platform API in dev | Medium | Set `VITE_API_URL=http://localhost:5000/api`; compat enabled when `NODE_ENV≠production` |
| Dual-write on CRM/Project/Task tables | High | Documented; remove Platform ops modules post Mongo sunset |
| Community mock data hides API gaps | Medium | H4 in TECH-DEBT-ROADMAP — wire feeds/opportunities to Platform API |
| Misconfigured prod env pointing Community at CoreKnot | High | `assertPlatformApiUrl()` fails fast at boot |

## Rollback

1. Remove `CoreknotCompatGuard` from legacy controllers (restore `@UseGuards(ClerkAuthGuard)` only).
2. Delete `platform-boundary.config.ts`, `coreknot-compat.guard.ts`, frontend `platform-api-url.ts` files.
3. Revert `getApiBaseUrl()` to trim-only behavior.
4. Set `PLATFORM_COREKNOT_COMPAT_ENABLED=true` if prod compat needed during emergency.

## Verification

```powershell
pnpm --filter @tsc/api typecheck
```

## P0 remaining (Agent 01 scope)

| ID | Item | Owner |
|----|------|-------|
| A01-P0-1 | Remove 16 CoreKnot ops modules from Platform API | Post Mongo sunset (step 10 in MASTER) |
| A01-P0-2 | Delete `CoreknotCompatModule` entirely | After CoreKnot client uses `api.coreknot.in` only |
| A01-P0-3 | Remove `LegacyJwtService` bridge | After CoreKnot Clerk auth live |
| A01-P0-4 | Wire Community off mock data | Agent 06 / H4 |
