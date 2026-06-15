# API Boundary Certificate (Agent 10)

> **Date:** 2026-06-15  
> **Authority:** [API-BOUNDARY.md](../architecture/API-BOUNDARY.md)  
> **Verdict:** **CERTIFIED with conditions** — public frontends enforce Platform API; CoreKnot client contract documented.

---

## Certificate scope

This certifies client → API routing for:

- `apps/website/` (TSC Website)
- `apps/community/` (TSC Community)
- Platform API boundary controls (`apps/api/src/modules/coreknot-compat/`)

**Out of scope:** `apps/coreknot/client/` (Worker scope excluded — documented only).

---

## Before state

| Client | Env var | Documented target | Runtime enforcement |
|--------|---------|-------------------|---------------------|
| Community | `NEXT_PUBLIC_API_URL` | Platform API | Trim URL only — no CoreKnot block |
| Website | `NEXT_PUBLIC_API_URL` | Platform API | Default localhost:4000 — no CoreKnot block |
| CoreKnot Client | `VITE_API_URL` | CoreKnot API | Not in Worker A scope |
| Platform compat | N/A | Transitional | Always on — CRM/project/task on Platform API |

**Illegal patterns detected:** None in Website/Community source. Architecture gap: Platform API served CoreKnot-shaped routes without prod disable.

---

## After state

### Website + Community → Platform API only

| Control | Implementation |
|---------|----------------|
| URL validation | `assertPlatformApiUrl()` rejects `*.coreknot.in`, `localhost:5000` |
| Community entry | `getApiBaseUrl()` in `apps/community/src/lib/utils.ts` |
| Website entry | `getApiBaseUrl()` in `apps/website/src/lib/api/public-api.ts` |
| SDK client | `useCommunityClient()` → validated base URL |
| Env docs | Comments in `.env.example` files |

### Platform API → CoreKnot compat limit

| Control | Implementation |
|---------|----------------|
| Env flag | `PLATFORM_COREKNOT_COMPAT_ENABLED` |
| Default | `false` when `NODE_ENV=production`; `true` in dev/staging |
| Guard | `CoreknotCompatGuard` → HTTP 410 with message pointing to `api.coreknot.in` |
| Routes gated | `/api/crm/*`, `/api/projects/*`, `/api/tasks/*`, `/api/campaigns` (legacy shapes) |

### CoreKnot Client contract (documented — not modified)

| Requirement | Value |
|-------------|-------|
| Production API | `https://api.coreknot.in` |
| Local API | `http://localhost:5000/api` |
| Env var | `VITE_API_URL` |
| **Must not use** | `api.theshakticollective.in` for CRM/project/task mutations |
| Auth | JWT (current) → Clerk (target) |

Configure in `apps/coreknot/client/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
# Production: VITE_API_URL=https://api.coreknot.in/api
```

---

## Client routing matrix (certified)

| Caller | Callee | Status |
|--------|--------|--------|
| Website | Platform API | ✅ Certified |
| Community | Platform API | ✅ Certified |
| Website | CoreKnot API | ❌ Forbidden — no code paths |
| Community | CoreKnot API | ❌ Forbidden — no code paths + runtime guard |
| CoreKnot Client | CoreKnot API | ✅ Required (documented) |
| CoreKnot Client | Platform API | ❌ Forbidden except server-side passport proxy |

---

## Shared controller / alias audit

Platform API alias controllers (Platform scope — **allowed**):

- `booking-alias.controller.ts`
- `event-intelligence-alias.controller.ts`
- `tsc-identity-alias.controller.ts`
- `automation-v2-alias.controller.ts`
- `event-agent-alias.controller.ts`

CoreKnot compat controllers (Platform scope — **sunset, gated**):

- `crm-legacy.controller.ts`
- `projects-legacy.controller.ts`
- `tasks-legacy.controller.ts`
- `campaigns-legacy.controller.ts`

---

## Risk

| Risk | Severity | Mitigation |
|------|----------|------------|
| Founder sets Community `NEXT_PUBLIC_API_URL` to CoreKnot | High | App throws at startup |
| Dev needs Platform compat for old CoreKnot client | Low | Set `PLATFORM_COREKNOT_COMPAT_ENABLED=true` |
| CoreKnot client still on Platform URL in prod | High | Founder: deploy CoreKnot API + update VITE_API_URL |

## Rollback

1. Remove frontend `assertPlatformApiUrl` calls.
2. Remove `CoreknotCompatGuard` from legacy controllers.
3. Delete boundary config files.

## Verification

```powershell
pnpm --filter @tsc/api typecheck
# Manual: set NEXT_PUBLIC_API_URL=http://localhost:5000/api → Community boot should throw
```

## P0 remaining (Agent 10 scope)

| ID | Item |
|----|------|
| A10-P0-1 | CoreKnot client production deploy with `VITE_API_URL=https://api.coreknot.in/api` |
| A10-P0-2 | Delete `CoreknotCompatModule` after client migration |
| A10-P0-3 | Add CI check: grep Community/Website for `coreknot.in` in env templates |
| A10-P0-4 | Platform API outbound sync secrets (`COREKNOT_SYNC_SECRET`) — founder task |

---

## Sign-off

| Check | Result |
|-------|--------|
| Website → Platform API only | ✅ |
| Community → Platform API only | ✅ |
| Runtime CoreKnot URL block (frontends) | ✅ |
| Compat layer prod gate | ✅ |
| Typecheck | Run post-commit |

**Conditions:** CoreKnot ops modules remain on Platform API until Mongo sunset (see PLATFORM-DOMAIN-REPORT.md).
