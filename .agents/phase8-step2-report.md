# Phase 8 Step 2 — Superfan Engine (Module 3)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 2 ships **Module 3 — Superfan Engine**: rule-based `superfanScore` + five-tier classification (`bronze` → `legend`), persisted in `SuperfanSnapshot`, exposed via fan/artist APIs, and surfaced in CoreKnot passport + artist workspace.

**Out of scope:** Step 3 Memberships, Step 4 Rewards redemption, Audience Intelligence V2, Fan Commerce, Audience OS, Command Center V4, Phase 9, Phase 10.

---

## Tier thresholds (configurable constants)

Defined in `packages/database/src/superfan.ts` as `SUPERFAN_TIER_THRESHOLDS`:

| Tier | Min score (inclusive) |
|------|----------------------|
| Bronze | 0 |
| Silver | 25 |
| Gold | 50 |
| Platinum | 75 |
| Legend | 90 |

Score weights (`SUPERFAN_SCORE_WEIGHTS`):

| Factor | Weight |
|--------|--------|
| Event checked-in | 8 each |
| Event registered | 3 each |
| PURCHASED edge | 10 each |
| FanProfile.spendScore | 0.3 per point |
| Active community membership | 6 each |
| REFERRED edge | 12 each |
| Membership duration (months since earliest community join) | 2 per month, cap 24 |

Final score clamped 0–100 via `clampFanScore()`.

---

## Schema

Fragment: `packages/database/prisma/phase8-step2.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `SuperfanTier` | bronze, silver, gold, platinum, legend |
| `SuperfanSnapshot` | personId, artistId?, superfanScore, tier, factors JSON, snapshotDate |

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/superfan.ts` — thresholds, `calculateSuperfanScore()`, `tierFromSuperfanScore()` |
| `@tsc/database` | `src/credits.ts` — `superfan_platinum: 10` earn reason |
| `@tsc/types` | `src/fan.ts` — SuperfanPayload, ArtistSuperfansPayload, segments |
| `@tsc/contracts` | `src/fan/index.ts` — SuperfanQuerySchema, ArtistSuperfansQuerySchema |
| `@tsc/contracts` | `src/credits/index.ts` — `superfan_platinum` reason |

---

## API (`apps/api/src/modules/fan`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/fans/:personId/superfan` | Public | Score + tier + factors (`?artistId=` optional) |
| POST | `/fans/superfan/refresh/:personId` | Admin (StubAuthGuard) | Recompute + persist snapshot; cron stub |
| GET | `/artists/:id/superfans` | Public | Top 100 fans by superfanScore (`?limit=`) |
| GET | `/artists/:id/superfan-segments` | Public | Count by tier for artist |

`SuperfanService` added; `FanModule` imports `CreditsModule`.

### Score calculation (no ML)

`SuperfanService.computeAndPersistSuperfan()` collects:

1. `EventParticipation` (global or artist-scoped via `event.artistId`)
2. `PURCHASED` relationship count + `FanProfile.spendScore`
3. `CommunityMember` active (global or `community.artistId`)
4. `REFERRED` relationship count
5. Earliest community `joinedAt` → membership months stub

Persists daily `SuperfanSnapshot` (upsert on `personId + artistId + snapshotDate`).

### Credit earn hook (Phase 6.5)

On admin refresh, when tier newly reaches **platinum** (from below platinum/legend):

- `CreditsService.earnFromSuperfanPlatinum()` — idempotent +10 via `superfan_platinum` reason
- Reference: `SuperfanSnapshot` id

---

## CoreKnot UI

| File | Changes |
|------|---------|
| `components/passport/SuperfanBadge.jsx` | Tier badge with icons/colors |
| `components/passport/FanProfileSection.jsx` | Renders SuperfanBadge |
| `components/intelligence/ArtistSuperfansPanel.jsx` | Top 100 table + segment pills |
| `pages/operating/artists/ArtistWorkspacePage.jsx` | ArtistSuperfansPanel wired |
| `lib/fanApi.js` | fetchSuperfan, refreshSuperfan, fetchArtistSuperfans, fetchArtistSuperfanSegments + mocks |

---

## Merge steps

1. Merge `phase8-step2.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step2-superfan
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
4. Restart API; verify:
   - `GET /api/fans/:personId/superfan`
   - `GET /api/artists/:id/superfans`
   - Ecosystem Passport Superfan badge
   - Artist workspace Superfans panel

---

## Deferred to Step 3 (Memberships)

- Paid membership products and SUBSCRIBED edge writers
- True membership duration from subscription start (replace community-join stub)
- Membership-tier boosts to superfan score
- Rewards catalog and redemption flows (Step 4)
- PURCHASED / REFERRED relationship writers from commerce/referral flows
- Superfan refresh cron job (POST refresh is admin stub only)
- Artist-scoped bulk snapshot job for all followers (currently lazy-compute on superfans list)
- Legend-tier credit bonus and tier-downgrade handling
- Unfollow / support undo impact on superfan score

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts` build
- [ ] API boots with `SuperfanService` in `FanModule`
- [ ] Platinum refresh awards +10 credits once (idempotent)
- [ ] Passport shows Superfan badge (mock fallback OK offline)
- [ ] Artist workspace shows top superfans panel
