# Community Domain Certificate (Agent 22)

> **Date:** 2026-06-15  
> **Scope:** `apps/community/` + Platform API community modules  
> **Verdict:** **FAIL** — API backends largely exist; frontend still mock-heavy; feed/posts stub.

Cross-reference: [ARCHITECTURE.md](../architecture/ARCHITECTURE.md)

---

## Domain audit

| Domain | Platform API module | Community UI | Data source | Status |
|--------|---------------------|--------------|-------------|--------|
| **Profiles** | `profile/`, `passport/`, `identity/` | `member-profile-view.tsx`, onboarding | API via `@tsc/community-sdk` | ⚠️ Partial |
| **Memberships** | `membership/` | Not wired in main nav flows | API ready | ⚠️ API-only |
| **Rewards** | `rewards/`, `credits/` | Not surfaced in UI audit | API ready | ⚠️ API-only |
| **Marketplace** | `marketplace/`, `opportunity/` | `opportunities-list.tsx` | **Mock** in `mock-data.ts` | ❌ |
| **Events** | `event/`, `event-intelligence/` | `events/page.tsx` | Mixed mock + scaffold | ⚠️ |
| **Posts / Feed** | `post/`, `feed/` — **stubs** | Feed nav exists | Stub health endpoints | ❌ |
| **Fans** | `fan/`, `audience/` | Dashboard mock metrics | Mock | ❌ |
| **Artists** | `artist/`, `creative-identity/` | Onboarding role selection | API on submit | ⚠️ |
| **Collaborations** | `collaboration/` | `collaborations/page.tsx` | Scaffold | ⚠️ |
| **Directory** | `directory/` | `directory/page.tsx` | Unknown — verify API wire | ⚠️ |
| **Learning hub** | — | `learning-hub/page.tsx` | Static/scaffold | ⚠️ |
| **Dashboard** | Multiple | `member-dashboard.tsx` | **`MOCK_DASHBOARD`** | ❌ |

---

## Auth & API client

| Check | Status | File |
|-------|--------|------|
| Clerk middleware | ✅ | `middleware.ts`, `clerk-middleware.ts` |
| API base URL | ✅ Required | `lib/utils.ts` — `NEXT_PUBLIC_API_URL` |
| Auth token injection | ✅ | `use-community-client.ts` → `@tsc/community-sdk` |
| Person ID resolution | ✅ | `lib/person-id.ts` → `/identity/resolve` |
| Stub auth header (dev) | ⚠️ | Must not ship to prod |

**Boundary compliance:** Community uses Platform API only — ✅ No CoreKnot API imports found.

---

## Onboarding flow (best wired path)

`onboarding-wizard.tsx` → `client.updateMyProfile()` — real API integration.

**Blocker:** Requires Clerk webhook to create `User`/`Person` before profile update succeeds for new signups.

---

## Mock data inventory

`apps/community/src/lib/mock-data.ts`:

- Dashboard snapshot, opportunities, events, insights — **all mock**
- Used by `member-dashboard.tsx`, opportunities components

**P1:** Replace with SDK calls to `/opportunities`, `/events`, `/fans/me`, etc.

---

## Membership → access gating

| Check | Status |
|-------|--------|
| API subscribe endpoint | ✅ |
| Paid checkout | ❌ track-only |
| Route middleware for tier | ❌ Not implemented |
| Reward redemption UI | ❌ Not found in community app |

---

## Events & participation

Prisma: `Event`, `EventParticipation` — API in `event.controller.ts`.

Community events page needs verification against live API (likely static during audit).

---

## Certification

| Domain | PASS/FAIL |
|--------|-----------|
| Profiles | ⚠️ WARN |
| Memberships | ⚠️ WARN |
| Rewards | ❌ FAIL (no UI) |
| Marketplace | ❌ FAIL |
| Events | ⚠️ WARN |
| Posts | ❌ FAIL |
| Fans/Artists | ⚠️ WARN |

**Agent 22 verdict: FAIL**
