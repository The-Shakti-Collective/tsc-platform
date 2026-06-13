# Phase 8 Step 9 — Audience OS (Module 10)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 9 ships **Module 10 — Audience OS**: unified read-only audience dashboards for artist managers and community leaders. Composes existing fan stack (FanProfile, Superfan, Memberships, Support, Audience snapshots, Fan Commerce, Deals) — no new ML/scoring engines, no new Prisma models.

**Out of scope:** Command Center V4 full UI (Step 10), PDF export, Phase 9, Phase 10.

---

## Dashboard payload shapes

### `GET /audience-os/artists/:id/dashboard`

```typescript
{
  artistId: string;
  name: string;
  slug: string | null;
  audienceMap: Array<{
    city: string;
    fanCount: number;
    eventParticipationCount: number;
    densityScore: number;
  }>;
  topFans: Array<{
    personId: string;
    displayName: string;
    slug: string | null;
    source: 'superfan' | 'supporter';
    score: number;
    tier?: string;
    totalSpent?: number;
    supportCount?: number;
  }>;
  revenue: {
    supportTotal: number;
    purchaseTotal: number;
    dealTotal: number;
    combinedTotal: number;
    currency: string;
    breakdown: { support: number; purchases: number; deals: number };
  };
  retention: {
    fanRetention: number;
    audienceChurn: number;
    fanConversion: number;
    lifetimeValueStub: number;
    snapshotDate: string;
  };
  growth: {
    audienceGrowth: number;
    snapshotDate: string;
    metrics: Record<string, unknown>;
  };
  membership: {
    activeSubscriptions: number;
    mrrStub: number;
    currency: string;
    programsCount: number;
  };
  commerce: {
    tickets: { count: number; revenue: number };
    merch: { count: number; revenue: number };
    experiences: { count: number; revenue: number };
    total: number;
    currency: string;
  };
  updatedAt: string;
}
```

**Aggregation sources:**

| Block | Composed from |
|-------|---------------|
| `audienceMap` | FanProfile.cities (followers) + EventParticipation (artist events) |
| `topFans` | `SuperfanService.getArtistSuperfans` + `SupportService.getArtistSupporters` (merged, deduped) |
| `revenue` | SupportAction sums + FanPurchase sums + Deal/revenueTransaction sums |
| `retention` / `growth` | `AudienceService.getArtistAudienceHealth` (AudienceHealthSnapshot) |
| `membership` | MembershipSubscription × program price (artist-linked communities) |
| `commerce` | FanPurchase grouped by productType (artist-linked catalog) |

### `GET /audience-os/communities/:id/dashboard`

```typescript
{
  communityId: string;
  name: string;
  slug: string | null;
  activeMembers: number;
  membershipRevenueStub: number;
  fanGrowth: number;
  eventConversion: number;
  memberGrowth: number;
  snapshotDate: string;
  topContributors: Array<{
    personId: string;
    name: string;
    activityCount30d: number;
    lastActiveAt: string | null;
  }>;
  membershipPrograms: Array<{
    programId: string;
    name: string;
    tier: string;
    price: number;
    currency: string;
    activeSubscriptions: number;
    revenueStub: number;
  }>;
  updatedAt: string;
}
```

**Aggregation sources:**

| Block | Composed from |
|-------|---------------|
| Snapshot metrics | `AudienceService.getCommunityAudience` (CommunityAudienceSnapshot) |
| `topContributors` | CommunityPost groupBy authorId (30d activity feed counts) |
| `membershipPrograms` | Membership programs + active MembershipSubscription counts |

### `GET /audience-os/artists/:id/export`

JSON stub wrapping full artist dashboard:

```typescript
{
  artistId: string;
  exportedAt: string;
  format: 'json';
  dashboard: ArtistAudienceOSDashboardPayload;
}
```

---

## Schema

No new models. All metrics computed at request time from existing Phase 8 entities.

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/types` | `src/audience-os.ts` — dashboard + export payloads |

---

## API (`apps/api/src/modules/audience-os`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/audience-os/artists/:id/dashboard` | Public | Unified artist audience dashboard |
| GET | `/audience-os/artists/:id/export` | Public | JSON export stub (no PDF) |
| GET | `/audience-os/communities/:id/dashboard` | Public | Unified community audience dashboard |

`AudienceOsModule` registered in `AppModule`. Imports `AudienceModule`, `FanModule`, `SupportModule`.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/audienceOsApi.js` | Dashboard fetch, JSON export, Ritviz + TSC Underground mocks |
| `pages/audience-os/ArtistAudienceOSPage.jsx` | Full artist manager dashboard |
| `pages/audience-os/CommunityAudienceOSPage.jsx` | Community leader dashboard |
| `pages/audience-os/INTEGRATION.patch.md` | Router wiring |
| `pages/operating/artists/ArtistWorkspacePage.jsx` | Audience OS link in header |
| `pages/operating/communities/CommunityDashboardPage.jsx` | Audience OS link in header |

---

## Files changed

### New
- `packages/types/src/audience-os.ts`
- `apps/api/src/modules/audience-os/audience-os.module.ts`
- `apps/api/src/modules/audience-os/audience-os.controller.ts`
- `apps/api/src/modules/audience-os/audience-os.service.ts`
- `apps/api/src/modules/audience-os/audience-os.repository.ts`
- `apps/api/src/modules/audience-os/schema/index.ts`
- `apps/coreknot/client/src/lib/audienceOsApi.js`
- `apps/coreknot/client/src/pages/audience-os/ArtistAudienceOSPage.jsx`
- `apps/coreknot/client/src/pages/audience-os/CommunityAudienceOSPage.jsx`
- `apps/coreknot/client/src/pages/audience-os/INTEGRATION.patch.md`
- `.agents/phase8-step9-report.md`

### Modified
- `packages/types/src/index.ts`
- `apps/api/src/app.module.ts`
- `apps/coreknot/client/src/pages/operating/artists/ArtistWorkspacePage.jsx`
- `apps/coreknot/client/src/pages/operating/communities/CommunityDashboardPage.jsx`

---

## Merge steps

1. **Types:** `packages/types` already exports `audience-os.js` via `index.ts`.
2. **API:** `AudienceOsModule` added to `AppModule` — no migration required.
3. **CoreKnot routes:** Apply `INTEGRATION.patch.md` to App.jsx (or central routes file).
4. **Proxy:** Ensure `/api/audience-os/*` proxies to Nest API (same pattern as `/api/audience/*`).
5. **Verify:**
   - `GET /api/audience-os/artists/:id/dashboard`
   - `GET /api/audience-os/communities/:id/dashboard`
   - `GET /api/audience-os/artists/:id/export`

---

## Deferred to Step 10 (Command Center V4)

- Full Command Center V4 UI shell with Audience OS tiles embedded
- Cross-artist / cross-community Audience OS comparison views
- PDF/CSV export (Step 9 ships JSON stub only)
- Real-time refresh controls on Audience OS pages (admin refresh stays on `/audience/refresh/*`)
- Spotify / Patreon / Discord live connector ingestion (Step 9 uses existing FanProfile + activity stubs only)
- Audience OS cache table (optional perf optimization — computed aggregation preferred for now)
