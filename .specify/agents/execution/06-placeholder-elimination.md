# 06 — Placeholder Elimination

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Order** | 6 of 15 |

## Mission

Replace PlaceholderPage routes and stub API controllers with real implementations or scoped "coming soon" with tracked backlog.

## Input

- `apps/community/` — 12 PlaceholderPage routes (per master report)
- `apps/api/src/modules/` — stub controllers (`status: 'stub'`)
- Agent 04 runtime green

## Tasks

1. Inventory placeholders: `rg "PlaceholderPage|placeholder" apps/community apps/website`.
2. Inventory API stubs: `rg "status: 'stub'" apps/api`.
3. Prioritize by user-facing impact: feed, profile, events, passport.
4. Implement or wire minimum viable pages calling existing API modules.
5. Remove or narrow stub controllers where backend exists.
6. Update route manifest in deliverable with before/after counts.
7. Ensure builds pass after each batch.

## Verification commands

```powershell
rg "PlaceholderPage" apps/community --count-matches
rg "status: 'stub'" apps/api
pnpm --filter @tsc/community build
pnpm --filter @tsc/api build
pnpm --filter @tsc/api typecheck
```

## Deliverable path

`.agents/reports/execution/06-placeholder-status.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Placeholder count | Reduced from 12; zero on P0 routes (feed, home, profile) |
| API stubs | Listed with sprint tag or implemented |
| Builds | Community + API build exit 0 |
| Report | Table of route → status (real / partial / deferred) |
