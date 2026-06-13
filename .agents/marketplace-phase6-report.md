# Phase 6 Report — Opportunity Marketplace

**Agent:** Implementer-Marketplace  
**Date:** 2026-06-12  
**Status:** Complete

## Summary

Phase 6 Deliverable 4 ships marketplace browse/apply/save flow, `OpportunityApplication` persistence contract, API module in `@tsc/api`, and CoreKnot UI. Intelligence ranking is read-only via existing `GET /intelligence/opportunities/suggested` — no new scoring engines.

---

## Schema (merge into `packages/database/prisma/schema.prisma`)

| Addition | Details |
|----------|---------|
| `OpportunityCategory` enum | scholarship, residency, brand_deal, festival_slot, workshop, collaboration, open_call, funding |
| `OpportunityApplicationStatus` enum | saved, applied, shortlisted, won, rejected |
| `Opportunity` extensions | category, city, deadline, marketplaceVisible, description |
| `OpportunityApplication` model | personId, artistId?, opportunityId, status, appliedAt, notes — unique (opportunityId, personId) |

Fragment: `packages/database/prisma/phase6-marketplace.prisma`

---

## Application state machine

```text
(saved) ──apply──► applied ──► shortlisted ──► won
                  │              │
                  └──────────────┴──► rejected
```

- **save**: creates/updates `saved` (blocked if already past saved)
- **apply**: `saved → applied` or create `applied` directly
- **shortlisted / won / rejected**: admin/system transitions (service helper ready)
- Terminal: `won`, `rejected`

Implementation: `apps/api/src/modules/opportunity/application-state.ts`

---

## API routes (@tsc/api)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/opportunities/marketplace` | Browse + filters (category, city, deadline) + suggested from intelligence |
| GET | `/opportunities/:id` | Detail + current user's application |
| POST | `/opportunities/:id/save` | Bookmark |
| POST | `/opportunities/:id/apply` | Submit application |
| POST | `/opportunities/:id/share` | Share stub (URL + message) |
| GET | `/artists/:id/applications` | Artist application tracker |

Module: `apps/api/src/modules/opportunity/`

---

## Integrations

| System | Wiring |
|--------|--------|
| Intelligence | `OpportunityService.browseMarketplace` calls `IntelligenceService.getSuggestedOpportunities` for match scores |
| Artist Passport | `OpportunityService.getPassportOpportunityHistory(artistId)` — applied/won/rejected history |
| Sync Layer | `OpportunitySyncEmitter` stub emits `opportunity.saved` / `opportunity.applied` on mutations |

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `OpportunityMarketplacePage.jsx` | Browse, filter, suggested panel, save/apply |
| `OpportunityDetailPage.jsx` | Detail, apply/save/share, status display |
| `ArtistApplicationTracker.jsx` | Workspace tracker |
| `opportunityApi.js` | API client + mock fallback |
| `hooks/queries/opportunity.js` | React Query hooks |

Routes (register in App.jsx):

- `/operating/opportunities/marketplace`
- `/operating/opportunities/:opportunityId`

---

## Package exports to merge

- `packages/database/src/marketplace.ts` → index re-export
- `packages/types/src/marketplace.ts` → index re-export
- `packages/contracts/src/opportunity/` + `"./opportunity"` subpath in package.json

---

## Verification

```powershell
# After schema merge + migrate
npx pnpm --filter @tsc/database prisma:validate

# UI (mock when API unavailable)
# /operating/opportunities/marketplace — filters + suggested
# /operating/opportunities/opp-m1 — apply/save/share
# /operating/artists/:id/workspace — application tracker
```

---

## Files touched

- `packages/database/prisma/phase6-marketplace.prisma`
- `packages/database/src/marketplace.ts`
- `packages/types/src/marketplace.ts`
- `packages/contracts/src/opportunity/*`
- `apps/api/src/modules/opportunity/*`
- `apps/coreknot/client/src/lib/opportunityApi.js`
- `apps/coreknot/client/src/hooks/queries/opportunity.js`
- `apps/coreknot/client/src/pages/operating/opportunities/*`
- `apps/coreknot/client/src/components/opportunities/ArtistApplicationTracker.jsx`
- `apps/coreknot/client/src/pages/operating/artists/ArtistWorkspacePage.jsx`
- `apps/coreknot/shared/foundationNav.cjs`
- `.agents/marketplace-phase6-report.md`
