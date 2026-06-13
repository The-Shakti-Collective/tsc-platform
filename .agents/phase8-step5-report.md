# Phase 8 Step 5 — Audience Intelligence V2 (Module 6)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 5 ships **Module 6 — Audience Intelligence V2**: artist-level `AudienceHealthSnapshot`, community-level `CommunityAudienceSnapshot`, rule-based computation service (no ML), REST APIs, Command Center V3/V4 audience prep, and CoreKnot audience panels.

**Out of scope:** Creator-Fan Economy commerce (Step 6), Event Intelligence deep dive (Step 7), Fan Commerce Ticket/Merch (Step 8), full Audience OS (Step 9), full Command Center V4 UI (Step 10), Phase 9, Phase 10.

---

## Snapshot shapes

### `AudienceHealthSnapshot` (artist-level)

| Field | Type | Description |
|-------|------|-------------|
| `artistId` | String | FK → Artist |
| `snapshotDate` | Date | UTC day bucket |
| `audienceGrowth` | Float | % follower growth (30d vs prior 30d) |
| `audienceChurn` | Float | Stub inverse of retention + growth drag |
| `fanRetention` | Float | % active followers + superfan/fan-intel loyalty blend |
| `fanConversion` | Float | Event check-in rate or platinum+ follower ratio |
| `lifetimeValueStub` | Float | spendScore × 12 + membership stub × 0.05 + superfan × 2 |
| `metrics` | JSON | Counts, periodDays, factor breakdown |

### `CommunityAudienceSnapshot` (community-level)

| Field | Type | Description |
|-------|------|-------------|
| `communityId` | String | FK → Community |
| `snapshotDate` | Date | UTC day bucket |
| `memberGrowth` | Float | % member growth (30d vs prior 30d) |
| `activeMembers` | Int | Members with Activity in last 30d |
| `membershipRevenueStub` | Float | Σ active subscription × program price |
| `fanGrowth` | Float | New silver+ superfans / total members |
| `eventConversion` | Float | Check-ins / registrations (artist-scoped events) |
| `metrics` | JSON | Counts, periodDays |

### `SuperfanSnapshot` (Step 2 — read helpers only)

Added `aggregateSuperfanRows()` + `SuperfanArtistAggregate` in `@tsc/database` — no duplicate model.

---

## Schema

Fragment: `packages/database/prisma/phase8-step5.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `AudienceHealthSnapshot` | Daily artist audience health rollup |
| `CommunityAudienceSnapshot` | Daily community audience rollup |

Relations: `Artist.audienceHealthSnapshots`, `Community.audienceSnapshots`.

---

## Computation service (rule-based — NO ML)

Package: `packages/database/src/audience.ts`

| Function | Inputs (read-only) |
|----------|-------------------|
| `computeAudienceHealth()` | ArtistFollow, FanProfile, SuperfanSnapshot, FanIntelligenceSnapshot (loyalty read), EventParticipation, MembershipSubscription, Activity |
| `computeCommunityAudience()` | CommunityMember, SuperfanSnapshot, EventParticipation, MembershipSubscription, Activity |

API service: `apps/api/src/modules/audience/audience.service.ts`

| Method | Behavior |
|--------|----------|
| `computeAudienceHealth(artistId)` | Collect factors → compute → upsert daily snapshot |
| `computeCommunityAudience(communityId)` | Collect factors → compute → upsert daily snapshot |
| GET endpoints | Return latest snapshot; lazy-compute if missing |
| POST refresh | Admin-only recompute + upsert |

**Does not rebuild** Phase 5 `FanIntelligenceSnapshot` calculators — reads existing loyalty scores only.

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/audience.ts` — thresholds, `computeAudienceHealth`, `computeCommunityAudience`; `src/superfan.ts` — `aggregateSuperfanRows`; `src/intelligence.ts` — model list |
| `@tsc/types` | `src/audience.ts` — snapshot + insight payloads, CommandCenterAudienceBlock |
| `@tsc/contracts` | `src/audience/index.ts` — insights query schemas |

---

## API (`apps/api/src/modules/audience`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/audience/artists/:id/health` | Public | Latest `AudienceHealthSnapshot` |
| GET | `/audience/communities/:id` | Public | Latest `CommunityAudienceSnapshot` |
| POST | `/audience/refresh/artist/:id` | StubAuthGuard + admin | Recompute artist snapshot |
| POST | `/audience/refresh/community/:id` | StubAuthGuard + admin | Recompute community snapshot |
| GET | `/audience/insights/top-growth-artists` | Public | Artists with growth ≥ 12% |
| GET | `/audience/insights/churn-risk` | Public | Artists with retention < 45% |

`AudienceModule` registered in `AppModule`. `IntelligenceModule` imports `AudienceModule` for Command Center.

---

## Command Center V4 prep (partial)

| Endpoint | Change |
|----------|--------|
| `GET /intelligence/command-center/v3` | `v3.audience` block added: most loyal communities, highest growth artists, highest churn risk |
| `GET /intelligence/command-center/v4` | Stub — returns audience block only (`stub: true`) |

Full V4 UI deferred to Step 10.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/audienceApi.js` | API + mocks for health, community, insights |
| `components/intelligence/AudienceInsightsPanel.jsx` | Growth, retention, conversion, LTV stub on Artist Workspace |
| `components/community/CommunityAudiencePanel.jsx` | Member growth, revenue stub, event conversion on Community Dashboard |
| `pages/operating/artists/ArtistWorkspacePage.jsx` | Wired `AudienceInsightsPanel` |
| `pages/operating/communities/CommunityDashboardPage.jsx` | Wired `CommunityAudiencePanel` |

---

## Merge steps

1. Merge `phase8-step5.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step5-audience
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
4. Restart API; verify:
   - `GET /api/audience/artists/:id/health`
   - `GET /api/audience/communities/:id`
   - `POST /api/audience/refresh/artist/:id` (admin)
   - `GET /api/audience/insights/top-growth-artists`
   - `GET /api/audience/insights/churn-risk`
   - `GET /api/intelligence/command-center/v3` → `v3.audience` populated
   - `GET /api/intelligence/command-center/v4` → audience stub
5. Open Artist Workspace + Community Dashboard — audience panels render (mock fallback OK offline).

---

## Deferred to Step 6 (Creator-Fan Economy)

- Real LTV from ticket/merch purchases and payment-backed revenue
- Rewards redemption rollups in audience health metrics
- Credit spend vs earn funnel in audience panels
- Superfan score factor from redemption history
- Paid commerce writers for PURCHASED edges affecting conversion
- Membership churn from subscription cancellations (vs community-join proxy)
- Audience refresh cron job (POST refresh is admin stub only)
- Bulk snapshot job for all artists/communities
- PersonFollow graph signals in retention (currently Activity + ArtistFollow)
- Event Intelligence deep dive KPIs (Step 7)
- Fan Commerce Ticket/Merch entities (Step 8)
- Full Audience OS dashboards (Step 9)
- Command Center V4 full UI + cross-module KPI tiles (Step 10)
- ML-based churn prediction or growth forecasting

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts` build
- [ ] API boots with `AudienceService` in `AudienceModule`
- [ ] Lazy-compute returns snapshot on first GET
- [ ] Admin refresh upserts same-day snapshot
- [ ] Command Center v3 includes `audience` block
- [ ] Artist Workspace + Community Dashboard panels render
