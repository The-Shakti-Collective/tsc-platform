# Phase 8 Step 3 — Community Membership Programs (Module 4)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 3 ships **Module 4 — Membership Layer** (community membership programs only): `Membership` program definitions, `MembershipSubscription` track-only subscribe/cancel, SUBSCRIBED fan-graph edges, activity + credit earn hooks, REST APIs, and CoreKnot community dashboard UI.

**Out of scope:** Step 4 Rewards redemption, Audience Intelligence V2, Fan Commerce, Audience OS, Command Center V4, Razorpay/payment gateway (Phase 10.3), Phase 9, Phase 10.

---

## Schema

Fragment: `packages/database/prisma/phase8-step3.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `MembershipBenefit` | early_access, private_events, meetups, discounts, exclusive_content |
| `MembershipProgramTier` | standard, plus, premium, circle, collective |
| `MembershipSubscriptionStatus` | active, cancelled, expired, pending |
| `Membership` | Program definition per community |
| `MembershipSubscription` | Fan subscription row (track-only, no payment) |
| `GraphEntityType` +1 | `Membership` for SUBSCRIBED edges |

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/membership-program.ts`; `credits.ts` +20 `subscribed_membership`; `activity.ts` action |
| `@tsc/types` | `src/membership-program.ts`; `activity.ts` +1 action; `relationship.ts` +Membership entity |
| `@tsc/contracts` | `src/membership-program/index.ts`; `credits/index.ts`; `activity/index.ts` |

---

## API (`apps/api/src/modules/membership`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/communities/:id/memberships` | StubAuthGuard | List programs for community |
| POST | `/communities/:id/memberships` | StubAuthGuard + leader | Create program |
| GET | `/memberships/:id` | Public | Get program |
| PATCH | `/memberships/:id` | StubAuthGuard + leader | Edit program |
| POST | `/memberships/:id/subscribe` | StubAuthGuard | Fan subscribes (track-only → active) |
| POST | `/memberships/:id/cancel` | StubAuthGuard | Cancel subscription |
| GET | `/fans/me/memberships` | StubAuthGuard | My active subscriptions |

`MembershipModule` replaces stub; imports `ActivityModule`, `CreditsModule`, `FanModule`.

### Subscribe side effects

1. Upsert `MembershipSubscription` (status `active`)
2. SUBSCRIBED edge Person → `Membership`
3. SUBSCRIBED edge Person → `Community` (metadata `{ membershipId }`)
4. Activity: `subscribed_membership`
5. Credit earn stub: +20 via `subscribed_membership` (idempotent per subscription)

### Cancel side effects

1. Subscription status → `cancelled`, `cancelledAt` set
2. End SUBSCRIBED edges (Membership + Community) via `effectiveTo`

Leader auth reuses community pattern: admin, artist manager, or Founder/Admin/Moderator.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/membershipApi.js` | API + mocks (TSC Underground Plus, Prabh Deep Circle, Ritviz Collective) |
| `components/community/CommunityMembershipPrograms.jsx` | Program grid on community dashboard |
| `components/community/MembershipSubscribeCard.jsx` | Subscribe/cancel card with benefits + credits toast |
| `pages/operating/communities/CommunityDashboardPage.jsx` | Renders `CommunityMembershipPrograms` |

---

## Example programs (mock)

| Name | Slug | Tier | Price |
|------|------|------|-------|
| TSC Underground Plus | tsc-underground-plus | plus | ₹499 |
| Prabh Deep Circle | prabh-deep-circle | circle | ₹999 |
| Ritviz Collective | ritviz-collective | collective | ₹799 |

---

## Merge steps

1. Merge `phase8-step3.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step3-membership
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
4. Restart API; verify:
   - `GET /api/communities/:id/memberships`
   - `POST /api/memberships/:id/subscribe` → +20 credits once
   - Community dashboard membership section (mock fallback OK offline)

---

## Deferred to Step 4 (Rewards)

- Rewards catalog and redemption flows
- Membership-tier perks beyond benefit enum stubs
- Subscription expiry/renewal cron and `expired` status automation
- Razorpay checkout and paid invoice records (Phase 10.3)
- Superfan score boost from paid membership tier (Step 2 still uses community-join stub)
- True membership duration in superfan factors from `MembershipSubscription.startedAt`
- Leader analytics: subscriber counts, MRR stub, churn
- Gift memberships, family plans, promo codes
- Membership-gated content enforcement (events, posts, early access)
- Audience Intelligence V2 membership rollups
- Fan Commerce bundle (membership + merch/tickets)
- Command Center V4 membership KPIs

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts` build
- [ ] API boots with `MembershipService` (not stub health)
- [ ] Subscribe creates SUBSCRIBED edges + activity + +20 credits (idempotent)
- [ ] Community dashboard shows membership programs (mock fallback OK offline)
