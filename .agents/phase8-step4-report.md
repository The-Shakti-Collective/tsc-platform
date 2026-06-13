# Phase 8 Step 4 — Rewards System (Module 5) — Ecosystem Credits Redemption

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 4 ships **Module 5 — Rewards Layer**: `Reward` catalog, `RewardRedemption` spend flow, credit earn stubs (share +3, refer +15), REST APIs, admin fulfillment stub, activity hook, and CoreKnot catalog + redemptions UI.

**Out of scope:** Real merch/ticket fulfillment, Audience Intelligence V2 (Step 5), Fan Commerce, Audience OS, Command Center V4, Phase 9, Phase 10.

---

## Schema

Fragment: `packages/database/prisma/phase8-step4.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `RewardCategory` | merch, tickets, meet_greet, community_access, priority_application |
| `RewardRedemptionStatus` | pending, fulfilled, cancelled |
| `Reward` | Catalog item (slug, creditCost, category, stock?, metadata) |
| `RewardRedemption` | Fan redemption row linked to Person + Reward |

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/rewards.ts` — categories, default catalog seed, helpers; `src/credits.ts` +share_content +refer_member, `CREDIT_SPEND_REASONS`; `src/activity.ts` +redeemed_reward |
| `@tsc/types` | `src/rewards.ts` — RewardRecord, Redemption payloads, share/refer stub payloads |
| `@tsc/contracts` | `src/rewards/index.ts` — catalog query, redemption patch, refer stub schemas; `src/credits/index.ts` earn reasons; `src/activity/index.ts` +redeemed_reward |

---

## Credit spend flow

```
POST /rewards/:id/redeem
  1. Validate reward active + stock (if limited)
  2. Optional idempotency: reject if same person+reward redeemed today (non-cancelled)
  3. Pre-check balance >= creditCost → 400 if insufficient
  4. Create RewardRedemption (status: pending)
  5. CreditsRepository.spend — decrement balance, increment lifetimeSpent, txn amount negative, reason redeem_reward
  6. Decrement stock if tracked
  7. Activity: redeemed_reward
  8. Return { redemptionId, balanceAfter, creditCost, status }
```

**Earn stubs (Phase 8 Step 4 additions):**

| Reason | Amount | Trigger |
|--------|--------|---------|
| `share_content` | +3 | `POST /credits/stub/share` — once per person per day |
| `refer_member` | +15 | `POST /credits/stub/refer` — creates REFERRED Person→Person edge, idempotent per relationship |

Existing earn rules unchanged: event +10, community +5, collab +25, opportunity +50, membership +20, platinum +10.

---

## API (`apps/api/src/modules/rewards`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/rewards` | Public | Browse catalog (seeds default items on first call) |
| GET | `/rewards/:id` | Public | Get reward |
| POST | `/rewards/:id/redeem` | StubAuthGuard | Deduct credits, create pending redemption |
| GET | `/fans/me/redemptions` | StubAuthGuard | My redemption history |
| PATCH | `/admin/rewards/redemptions/:id` | StubAuthGuard + admin | Mark fulfilled / update notes |
| POST | `/credits/stub/share` | StubAuthGuard | Share earn stub (+3/day) |
| POST | `/credits/stub/refer` | StubAuthGuard | Refer earn stub (+15, REFERRED edge) |

`RewardsModule` imports `ActivityModule`, `CreditsModule`, `FanModule`.  
`CreditsModule` now imports `PrismaModule` for refer-stub relationship upsert.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/rewardsApi.js` | API + mocks (5 category examples) |
| `pages/rewards/RewardsCatalogPage.jsx` | Browse, filter by category, redeem, share stub |
| `pages/rewards/MyRedemptionsPage.jsx` | Redemption history with status badges |
| `pages/rewards/INTEGRATION.patch.md` | Route wiring instructions |

---

## Default catalog (seed)

| Name | Category | Credits |
|------|----------|---------|
| TSC Underground Tee | merch | 120 |
| Ritviz Live — Mumbai GA | tickets | 250 |
| Prabh Deep Meet & Greet | meet_greet | 400 |
| TSC Private Discord Access | community_access | 80 |
| Collab Priority Application Pass | priority_application | 150 |

---

## Merge steps

1. Merge `phase8-step4.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step4-rewards
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
4. Wire CoreKnot routes per `INTEGRATION.patch.md`.
5. Restart API; verify:
   - `GET /api/rewards` → 5 seeded items
   - `POST /api/rewards/:id/redeem` → balance drops, redemption pending
   - `GET /api/fans/me/redemptions`
   - `POST /api/credits/stub/share` → +3 once/day
   - `POST /api/credits/stub/refer` → REFERRED edge + +15 once

---

## Deferred to Step 5 (Audience Intelligence V2)

- Rewards redemption rollups in fan/artist intelligence panels
- Credit spend vs earn analytics, redemption funnel, category affinity
- Superfan score factor from redemption history
- Leader/admin fulfillment queue UI (beyond admin PATCH stub)
- Inventory sync, low-stock alerts, auto-cancel on stock-out
- Membership-tier reward discounts or gated catalog items
- Real fulfillment integrations (merch ship, ticket QR, Discord bot)
- Referral program UI and share tracking beyond daily stub
- Command Center V4 rewards KPIs
- Fan Commerce bundle (rewards + merch checkout)
- Phase 10 payment-backed credit purchases

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts` build
- [ ] API boots with `RewardsService`
- [ ] Redeem deducts credits + creates pending redemption (400 on insufficient balance)
- [ ] Share/refer stubs award credits idempotently
- [ ] Rewards catalog + My Redemptions pages render (mock fallback OK offline)
