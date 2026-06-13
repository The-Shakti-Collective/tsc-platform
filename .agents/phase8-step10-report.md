# Phase 8 Step 10 — Command Center V4 (FINAL)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 10 ships **Command Center V4 — Audience Economy executive view**: platform audience KPI aggregates, insight lists (loyal communities, growth artists, churn risk), and CoreKnot UI layered above existing V3 creator-economy + Phase 6.5 participation blocks. Read-only aggregates only — no new ML, no new Prisma models.

**Phase 8 is complete.** All 10 steps (Modules 1–10 + Command Center V4) are implemented.

---

## Phase 8 — Full summary (Steps 1–10)

| Step | Module | Delivered |
|------|--------|-----------|
| **1** | Universal Fan Identity & Fan Graph | `FanProfile`, `ArtistFollow`, fan APIs, passport UI, auto-create hooks |
| **2** | Superfan Engine | Rule-based tiers (`bronze`→`legend`), `SuperfanSnapshot`, artist superfans API |
| **3** | Membership Programs | `Membership`, `MembershipSubscription`, community subscribe/cancel, SUBSCRIBED edges |
| **4** | Rewards System | `Reward`, `RewardRedemption`, credit earn + catalog redemption |
| **5** | Audience Intelligence V2 | `AudienceHealthSnapshot`, `CommunityAudienceSnapshot`, insights APIs, V3 audience prep |
| **6** | Creator-Fan Economy | `SupportAction` ledger, support APIs, SUPPORTED/PURCHASED graph edges |
| **7** | Event Intelligence | `EventIntelligenceSnapshot`, pre/post event analytics, platform insights |
| **8** | Fan Commerce | `Ticket`, `CommerceProduct`, `CommerceExperience`, `FanPurchase` orders |
| **9** | Audience OS | Artist + community dashboards, JSON export stub, CoreKnot Audience OS pages |
| **10** | Command Center V4 | Platform audience KPIs + insight lists + executive UI (this step) |

---

## V4 API

### `GET /intelligence/command-center/v4?period=weekly|monthly`

**Auth:** Admin (`StubAuthGuard` + admin role)

**Payload:**

```typescript
{
  period: 'weekly' | 'monthly';
  audienceKpis: {
    totalFans: number;              // distinct Person with FanProfile OR ArtistFollow
    monthlyActiveFans: number;      // fans with Activity in 30d window
    superfans: {
      gold: number;
      platinum: number;
      legend: number;
      total: number;                // gold + platinum + legend
    };
    membershipRevenue: {
      mrrStub: number;              // Σ active MembershipSubscription × program price
      currency: 'INR';
      activeSubscriptions: number;
    };
    audienceGrowth: number;           // avg AudienceHealthSnapshot.audienceGrowth (latest per artist)
    audienceChurn: {
      avgChurn: number;               // avg AudienceHealthSnapshot.audienceChurn
      churnRiskArtistCount: number;   // artists with fanRetention < 45%
    };
  };
  insights: {
    mostLoyalCommunities: Array<{ communityId, name, fanRetention, memberGrowth, activeMembers }>;
    highestGrowthArtists: Array<{ artistId, name, slug, audienceGrowth, fanRetention, lifetimeValueStub, snapshotDate }>;
    highestChurnRisk: Array<{ artistId, name, slug, fanRetention, audienceChurn, audienceGrowth, snapshotDate, riskLevel }>;
  };
  // Legacy command-center sections (same as v3 route)
  topOpportunities, artistsAtRisk, citiesHeatingUp, communitiesGrowingFast,
  revenueForecast, bookingDemandForecast, executive,
  participation,   // Phase 6.5 block
  v3,              // V3 creator-economy block (revenue, deals, brands, artists)
  updatedAt: string;
}
```

### Aggregation sources

| KPI | Source |
|-----|--------|
| `totalFans` | Union distinct `ArtistFollow.personId` + `FanProfile.personId` |
| `monthlyActiveFans` | Distinct fan `Activity.actorPersonId` in 30d |
| `superfans` | Latest `SuperfanSnapshot` per person, tiers gold/platinum/legend |
| `membershipRevenue.mrrStub` | Active `MembershipSubscription` × `Membership.price` |
| `audienceGrowth` | Mean of latest per-artist `AudienceHealthSnapshot.audienceGrowth` |
| `audienceChurn` | Mean churn + count where `fanRetention < CHURN_RISK_RETENTION_THRESHOLD` |
| `insights.mostLoyalCommunities` | `CommunityAudienceSnapshot` ordered by `activeMembers` (retention computed from metrics) |
| `insights.highestGrowthArtists` | `AudienceService.getTopGrowthArtists` (growth ≥ 12%) |
| `insights.highestChurnRisk` | `AudienceService.getChurnRiskArtists` (retention < 45%) |

---

## Backend files (Step 10)

| File | Change |
|------|--------|
| `apps/api/src/modules/intelligence/command-center-v4.repository.ts` | **New** — platform audience KPI aggregates |
| `apps/api/src/modules/intelligence/intelligence.service.ts` | Full `getCommandCenterV4(period)` composes v4 KPIs + v3 base |
| `apps/api/src/modules/intelligence/intelligence.controller.ts` | V4 accepts `period` query |
| `apps/api/src/modules/intelligence/intelligence.module.ts` | Registers `CommandCenterV4Repository` |
| `apps/api/src/modules/intelligence/types/index.ts` | `CommandCenterV4Payload`, `CommandCenterV4AudienceKpis` |
| `apps/api/src/modules/audience/audience.service.ts` | Loyal community retention from snapshot metrics |
| `apps/api/src/modules/audience/audience.repository.ts` | Loyal communities order by `activeMembers` |
| `packages/types/src/audience.ts` | `CommandCenterV4AudienceKpis` exported |

---

## CoreKnot UI

| File | Change |
|------|--------|
| `apps/coreknot/client/src/lib/intelligenceApi.js` | `fetchCommandCenter` → `/command-center/v4`; mock `audienceKpis` + `insights` |
| `apps/coreknot/client/src/pages/operating/ExecutiveCommandCenterPage.jsx` | V4 header; 6 audience KPI cards; 3 insight lists; V3 + participation below |

**Layout order:**

1. Audience Economy KPIs (6 cards)
2. Most Loyal Communities / Highest Growth Artists / Highest Churn Risk
3. Creator Economy KPIs (V3)
4. Ecosystem Participation (Phase 6.5)
5. Legacy sections (opportunities, cities, forecasts)

Insight rows link to Audience OS routes (`/operating/artists/:id/audience-os`, `/operating/communities/:id/audience-os`).

---

## Schema

**No new models in Step 10.** All metrics computed from existing Phase 8 entities.

---

## Prisma migration batch — all Phase 8 fragments

Apply in order (merge into `schema.prisma`, then `prisma migrate dev`):

| Order | Fragment | Models / enums added |
|-------|----------|----------------------|
| 1 | `packages/database/prisma/phase8-step1.prisma` | `FanProfile`, `ArtistFollow`, relationship enum extensions |
| 2 | `packages/database/prisma/phase8-step2.prisma` | `SuperfanSnapshot`, `SuperfanTier` |
| 3 | `packages/database/prisma/phase8-step3.prisma` | `Membership`, `MembershipSubscription`, membership enums |
| 4 | `packages/database/prisma/phase8-step4.prisma` | `Reward`, `RewardRedemption`, reward enums |
| 5 | `packages/database/prisma/phase8-step5.prisma` | `AudienceHealthSnapshot`, `CommunityAudienceSnapshot` |
| 6 | `packages/database/prisma/phase8-step6.prisma` | `SupportAction`, support enums |
| 7 | `packages/database/prisma/phase8-step7.prisma` | `EventIntelligenceSnapshot` |
| 8 | `packages/database/prisma/phase8-step8.prisma` | `Ticket`, `CommerceProduct`, `CommerceExperience`, `FanPurchase`, commerce enums |

> Steps 9–10 add **no** new fragments — they compose existing models.

### Merge / deploy checklist

1. Confirm all 8 fragments merged into `packages/database/prisma/schema.prisma`.
2. Run `pnpm --filter @tsc/database prisma migrate dev --name phase8-audience-layer` (or equivalent monorepo script).
3. Seed or backfill snapshots if dashboards empty:
   - `POST /audience/refresh/artist/:id` (admin)
   - `POST /audience/refresh/community/:id` (admin)
   - Superfan recompute via existing fan module refresh paths
4. Rebuild packages: `@tsc/database`, `@tsc/types`, `@tsc/api`.
5. Proxy routes: `/api/intelligence/*`, `/api/audience/*`, `/api/audience-os/*`, `/api/fans/*`.
6. Verify:
   - `GET /api/intelligence/command-center/v4?period=weekly`
   - CoreKnot `/operating/command-center` renders audience KPIs + insight lists
7. Optional cron (Phase 9): nightly audience + superfan snapshot refresh.

---

## Phase 9 readiness — Autonomous Ecosystem entry points

Phase 8 leaves these **stubbed or partial** surfaces ready for Phase 9 wiring:

| Entry point | Location | Phase 9 use |
|-------------|----------|-------------|
| Intelligence action stubs | `POST /intelligence/actions/*`, `IntelligenceService.runIntelligenceAction` | Wire Command Center buttons to real automation runs |
| Automation rules + runs | `AutomationService`, `AutomationController` | Event-triggered workflows (churn outreach, growth campaigns) |
| Goal engine | `GoalService`, `GoalController` | OKR-style targets from Command Center KPIs |
| Audience refresh | `POST /audience/refresh/*` | Scheduled snapshot recompute before autonomous decisions |
| Churn / growth insights | `/audience/insights/churn-risk`, `/audience/insights/top-growth-artists` | Trigger conditions for automation rules |
| Command Center V4 KPIs | `/intelligence/command-center/v4` | Goal thresholds + executive alerting |
| Audience OS export | `GET /audience-os/artists/:id/export` | Agent context payloads for autonomous ops |
| Support / purchase stubs | `SupportAction.status = pending_payment` | Phase 10 payment gateway hooks (not Phase 9) |

**Explicitly deferred to Phase 9 (not implemented):**

- Autonomous campaign execution from insight lists
- ML-based churn prediction (Phase 8 uses rule-based snapshots only)
- Live connector ingestion (Spotify, Patreon, Discord)
- Cross-artist Audience OS comparison views
- PDF/CSV export (JSON stub only in Step 9)

**Phase 10 (Industry Infrastructure)** remains after Phase 9: payment gateway, real fulfillment, industry APIs.

---

## Verify

```bash
# API (admin context)
GET /api/intelligence/command-center/v4?period=weekly
GET /api/intelligence/command-center/v4?period=monthly

# UI
Open CoreKnot → Operating → Executive Command Center
Toggle weekly/monthly — audience KPIs + insight lists render at top
```

---

## Phase 8 complete

All audience-layer modules (Fan Identity → Superfan → Memberships → Rewards → Audience V2 → Creator Economy → Event Intelligence → Fan Commerce → Audience OS → Command Center V4) are shipped. Next milestone: **Phase 9 — Autonomous Ecosystem**.
