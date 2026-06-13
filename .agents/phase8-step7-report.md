# Phase 8 Step 7 — Event Intelligence (Module 8)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 7 ships **Module 8 — Event Intelligence**: `EventIntelligenceSnapshot` entity, rule-based pre-event predictions and post-event analysis from `EventParticipation` + `SupportAction` data, REST APIs, platform insight endpoints, graph-based recommendations stub, and CoreKnot `EventIntelligencePanel`.

**Out of scope:** Fan Commerce Ticket/Merch catalog (Step 8), Audience OS (Step 9), Command Center V4 full UI (Step 10), Phase 9, Phase 10, ML forecasting.

---

## EventIntelligenceSnapshot entity

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | cuid |
| `eventId` | String | FK → Event |
| `snapshotDate` | DateTime | UTC day bucket |
| `predictedAttendance` | Float? | Pre-event forecast |
| `actualAttendance` | Float | Checked-in count |
| `predictedRevenueStub` | Float? | Pre-event revenue stub |
| `actualRevenueStub` | Float | Ticket + membership support |
| `conversionRate` | Float | Registrants → check-ins % |
| `audienceGrowthImpact` | Float | Post-event follow score |
| `communityImpact` | Float | Post-event community joins |
| `fanDensityByCity` | JSON | Attendee city distribution |
| `metrics` | JSON | Factor breakdown |

Also: `Venue.capacity Int?` (optional, default 300 in formulas).

---

## Schema

Fragment: `packages/database/prisma/phase8-step7.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / field | Purpose |
|---------------|---------|
| `EventIntelligenceSnapshot` | Persisted daily event KPI snapshot |
| `Venue.capacity` | Venue capacity input for attendance forecast |
| `Event.intelligenceSnapshots` | Relation |

---

## Formulas (rule-based stubs)

### predictAttendance
```
base = capacity × 0.4
fanFactor = 1 + min(fanCount/500, 0.5)
communityFactor = 1 + min(communityMembers/200, 0.3)
cityFactor = 1 + min(cityAvgCheckIns/200, 0.2)
predicted = clamp(max(base × factors, registrations × 1.15), 0, capacity)
```
Inputs: venue capacity, artist `ArtistFollow` count, artist community member count, city historical avg check-ins.

### predictRevenueStub
```
ticketRevenue = sum(buy_ticket amounts) OR count × ₹500 stub
fillRevenue = max(0, predicted − ticketCount) × ₹500 × 0.35
membershipRevenue = community buy_membership amounts (+ small stub if tickets exist)
```

### analyzeConversion
```
conversionRate = (checkedIn / registered) × 100
```

### analyzeAudienceGrowth (7-day post-event window)
```
impact = clamp((artistFollows×2 + personFollows) / checkedIn × 100, 0, 100)
```

### analyzeCommunityImpact
```
impact = clamp(communityJoins / checkedIn × 100, 0, 100)  (or joins×10 if no check-ins)
```

### fanDensityByCity
Count attendee `FanProfile.cities` entries per city for the event.

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/event-intelligence.ts` — formulas, constants |
| `@tsc/types` | `src/event-intelligence.ts` — API payloads |
| `@tsc/contracts` | `src/event-intelligence/index.ts` — query schemas |
| `@tsc/analytics` | re-exports event intelligence from `@tsc/database` |

---

## API (`apps/api/src/modules/event-intelligence`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/events/:id/intelligence` | StubAuthGuard | Latest snapshot + live metrics merge |
| GET | `/events/:id/intelligence/predict` | StubAuthGuard | Pre-event forecast |
| POST | `/events/:id/intelligence/refresh` | StubAuthGuard | Admin/organizer persist snapshot |
| GET | `/events/:id/intelligence/recommendations` | StubAuthGuard | Cities, venues, partners (graph stub) |
| GET | `/events/intelligence/insights/cities` | StubAuthGuard | Fan density rankings |
| GET | `/events/intelligence/insights/conversion-leaders` | StubAuthGuard | Best attendee conversion artists |
| GET | `/events/intelligence/insights/repeat-attendance` | StubAuthGuard | Communities driving repeat attendance |

`EventIntelligenceModule` registered in `AppModule`. Uses `EventRepository` for access checks.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/eventIntelligenceApi.js` | Fetch intelligence, predict, refresh, insights + mocks |
| `components/events/EventIntelligencePanel.jsx` | KPI cards, city density, recommendations stub |
| `pages/operating/events/INTEGRATION.patch.md` | Wire panel on future event detail page |

---

## Merge steps

1. Merge `phase8-step7.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step7-event-intelligence
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts -w @tsc/analytics
   npm run build -w @tsc/api
   ```
4. Restart API; verify:
   - `GET /api/events/:id/intelligence` → snapshot + live metrics
   - `GET /api/events/:id/intelligence/predict` → forecast
   - `POST /api/events/:id/intelligence/refresh` → persisted snapshot (admin/organizer)
   - `GET /api/events/:id/intelligence/recommendations`
   - `GET /api/events/intelligence/insights/cities`
   - `GET /api/events/intelligence/insights/conversion-leaders`
   - `GET /api/events/intelligence/insights/repeat-attendance`
5. Wire `EventIntelligencePanel` per `INTEGRATION.patch.md` when event detail page exists.

---

## Deferred to Step 8 (Fan Commerce)

- Ticket/Merch catalog entities and real ticket prices on register
- Merch attach rate and per-SKU revenue on events
- Workshop/experience revenue breakdown
- Inventory-aware attendance caps
- Refund-adjusted revenue and conversion
- Supporter panels on event public pages
- Payment webhook → `actualRevenueStub` sync (Phase 10.3)
- ML attendance/revenue forecasting
- Cross-event fan LTV rollups in Command Center
- Automated nightly snapshot cron job
- Export event intelligence reports (CSV/PDF)

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts`, `@tsc/analytics` build
- [ ] API boots with `EventIntelligenceModule`
- [ ] Intelligence endpoints return computed metrics from participation + support
- [ ] Refresh persists `EventIntelligenceSnapshot` row
- [ ] EventIntelligencePanel renders (mock fallback OK offline)
