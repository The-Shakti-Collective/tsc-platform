# CoreKnot Phase 5 Report — Executive Intelligence UI

**Agent:** Implementer-CoreKnot  
**Date:** 2026-06-12  
**Status:** Complete — new modules written; integration patches documented

## Summary

Phase 5 Executive Intelligence UI shipped in `apps/coreknot/client`. Minimal diffs — no CoreKnot server rewrite, no `@tsc/api` controller work, no `.specify/memory` edits. Mock fallback when `/api/intelligence/*` unavailable (same pattern as `analyticsApi.js`).

## Deliverables

| Item | Path | Notes |
|------|------|-------|
| Intelligence API client | `client/src/lib/intelligenceApi.js` | `VITE_TSC_API_URL` → `/api/intelligence/*` |
| React Query hooks | `client/src/hooks/queries/intelligence.js` | `useCommandCenter`, `useArtistHealth`, `useOpportunityIntelligence`, `useEcosystemGraph` |
| Executive Command Center | `client/src/pages/operating/ExecutiveCommandCenterPage.jsx` | 6 exec sections + weekly/monthly tabs |
| Artist health panel | `client/src/components/intelligence/ArtistHealthPanel.jsx` | Score 92/100 style + risk alerts |
| Opportunity intelligence | `client/src/components/intelligence/OpportunityIntelligencePanel.jsx` | Suggested + hot/warm/cold buckets |
| Ecosystem graph view | `client/src/components/intelligence/EcosystemGraphView.jsx` | Artist hub + 9 cluster drill-down |
| Nav contract | `shared/foundationNav.cjs` | Command Center order 2 (Operating) |
| Integration guide | `client/src/pages/operating/artists/ArtistWorkspacePage.phase5.patch.md` | App.jsx, sidebar, workspace wiring |

## Executive Command Center Sections

| Section | Payload keys |
|---------|----------------|
| Today's Tasks / Calls | `todayTasks[]`, `todayCalls[]` |
| Upcoming Events | `upcomingEvents[]` |
| Pending Payments | `pendingPayments[]` |
| Revenue / Profit | `revenueProfit` |
| Community / Artist Growth | `communityArtistGrowth` |
| Sales / Team Performance | `salesPerformance`, `teamPerformance[]` |
| Weekly / Monthly tabs | `periodTabs.weekly`, `periodTabs.monthly` — fans, artists, revenue, expenses, department/city/community |

## API Contract (client expects)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/intelligence/command-center?period=weekly\|monthly` | Executive dashboard |
| GET | `/api/intelligence/artists/:artistId/health` | Artist health score + risk alerts |
| GET | `/api/intelligence/opportunities` | Suggested opportunities + lead buckets |
| GET | `/api/intelligence/artists/:artistId/ecosystem-graph` | Ecosystem graph clusters |

`apps/api` has no intelligence module yet — client falls back to mock data and shows amber banner when `_source === 'mock'`.

## Routes

| Path | Page |
|------|------|
| `/operating/command-center` | ExecutiveCommandCenterPage |
| `/dashboard/intelligence` | ExecutiveCommandCenterPage (alias) |
| Artist workspace | ArtistHealthPanel, EcosystemGraphView, OpportunityIntelligencePanel (embedded) |

## Mock Fallback

- Command center: 3 tasks, 2 calls, 3 events, 3 pending payments, weekly/monthly period metrics
- Artist health: 92/100, 4 dimensions, 2 risk alerts
- Opportunities: 3 suggested, 2 hot / 2 warm / 2 cold
- Ecosystem graph: fans, events, revenue streams, communities, venues, curators, sponsors, collaborators, opportunities

## Nav Impact

- **One new sidebar item** — Command Center (order 2, after Operating Dashboard)
- Operating dashboard **Command Center →** link
- Page permission: `dashboard` (same as operating dashboard)
- Apply `OutletSidebar.jsx` + `navPageAccess.js` patches from integration guide if not auto-merged

## Intentionally Not Done

- No `apps/api` intelligence controller (per scope: client-only)
- No CoreKnot Express server changes
- No `.specify/memory/*` edits
- No graph visualization library — cluster chip UI only (minimal diff)

## Verification

1. Sidebar → **Command Center** → exec sections + weekly/monthly tabs (mock if API down)
2. `/operating/dashboard` → **Command Center →** link
3. `/operating/artists/:id/workspace` → health 92/100, ecosystem graph clusters, opportunity buckets
4. Set `VITE_TSC_API_URL` when `@tsc/api` implements `/api/intelligence/*`

## Files Touched

- `apps/coreknot/client/src/lib/intelligenceApi.js` (new)
- `apps/coreknot/client/src/hooks/queries/intelligence.js` (new)
- `apps/coreknot/client/src/pages/operating/ExecutiveCommandCenterPage.jsx` (new)
- `apps/coreknot/client/src/components/intelligence/ArtistHealthPanel.jsx` (new)
- `apps/coreknot/client/src/components/intelligence/OpportunityIntelligencePanel.jsx` (new)
- `apps/coreknot/client/src/components/intelligence/EcosystemGraphView.jsx` (new)
- `apps/coreknot/shared/foundationNav.cjs`
- `apps/coreknot/client/src/pages/operating/artists/ArtistWorkspacePage.phase5.patch.md` (integration guide)
- `.agents/coreknot-phase5-report.md` (this file)

## Integration patches still needed (if App.jsx / sidebar not merged)

See `ArtistWorkspacePage.phase5.patch.md` for exact diffs on `App.jsx`, `OperatingDashboardPage.jsx`, `ArtistWorkspacePage.jsx`, `navPageAccess.js`, `OutletSidebar.jsx`.
