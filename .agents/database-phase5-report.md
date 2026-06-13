# Database Phase 5 Report — Ecosystem Intelligence Domain

**Agent:** Implementer-Database  
**Date:** 2026-06-12  
**Status:** Complete

## Summary

Phase 5 ecosystem intelligence landed in `@tsc/database` — additive on Phase 4 spine (40 models). +13 models, +8 enums. Extended `RecommendationCandidate` with rule linkage + metadata. `@tsc/types`, `@tsc/contracts`, `packages/database/src/intelligence.ts` aligned. `prisma validate` + all three package builds pass.

**Baseline preserved:** No Phase 2.5–4 models removed. `Relationship` unchanged — `EcosystemGraphEdge` is a view helper over existing edges; optional `GraphSnapshot` for rollups.

---

## Feature coverage

| Area | Status | Models / deliverables |
|------|--------|----------------------|
| Opportunity / lead scoring | ✅ | `OpportunityScore`, `LeadScore` + `ScoreTier` enum |
| AI-suggested opportunities | ✅ | `SuggestedOpportunity` + status enum |
| Artist health | ✅ | `ArtistHealthSnapshot` — dimensions + riskAlerts JSON |
| Fan intelligence | ✅ | `FanIntelligenceSnapshot` — 5 score columns + tier enum |
| City recommendations | ✅ | `CityRecommendation` + recommendationType enum |
| Community intelligence | ✅ | `CommunityIntelligenceSnapshot` |
| Recommendation rules | ✅ | `RecommendationRule` + `RecommendationCandidate.ruleId` / `metadata` |
| Automation | ✅ | `AutomationRule`, `AutomationRun` |
| Goals | ✅ | `Goal`, `GoalProgress` |
| Graph snapshot | ✅ | `GraphSnapshot` (optional rollup; edges stay in `Relationship`) |
| Ecosystem graph view | ✅ | `toEcosystemGraphEdge()` maps `Relationship` → `EcosystemGraphEdge` |

---

## Schema inventory

### Model count

| Layer | Count |
|-------|-------|
| Phase 4 baseline | 40 |
| Phase 5 additive | 13 |
| **Total** | **53** |

### Phase 5 enums

| Enum | Values |
|------|--------|
| `ScoreTier` | hot, warm, cold |
| `FanIntelligenceTier` | super, active, casual, dormant |
| `SuggestedOpportunityStatus` | suggested, accepted, dismissed, expired, converted |
| `CityRecommendationType` | expand_market, host_event, partner_venue, grow_community, recruit_talent, other |
| `AutomationRuleStatus` | active, paused, disabled |
| `AutomationRunStatus` | pending, running, completed, failed, cancelled |
| `GoalEntityType` | Artist, Organization, Community, Person, Venue, Platform |
| `GoalPeriod` | daily, weekly, monthly, quarterly, yearly, custom |

### Phase 5 models (detail)

#### OpportunityScore / LeadScore
- `OpportunityScore`: `opportunityId`, `factors` JSON, `tier`, `confidence`, `scoredAt`
- `LeadScore`: `personId`, optional `opportunityId`, same scoring shape
- Indexes on tier + scoredAt desc

#### SuggestedOpportunity
- `artistId`, `type`, `title`, `rationale`, `potentialAttendance`, `confidence`, `status`

#### ArtistHealthSnapshot
- `artistId`, `healthScore`, `dimensions` JSON, `riskAlerts` JSON array
- Unique `(artistId, snapshotDate)`

#### FanIntelligenceSnapshot
- `personId`, optional `artistId`, explicit score columns (engagement, purchase, attendance, influence, loyalty)
- `tier` FanIntelligenceTier; unique `(personId, artistId, snapshotDate)`

#### CityRecommendation
- `city`, `recommendationType`, `rationale`, `priority` (indexed desc)

#### CommunityIntelligenceSnapshot
- `communityId`, `growth`, `retention`, `churn`, `superFanCount`, `dormantCount`, `metrics` JSON
- Unique `(communityId, snapshotDate)`

#### RecommendationRule (extends F-010)
- `name`, `slug`, `conditions`, `weights`, `priority`, `isActive`
- `RecommendationCandidate` extended: `ruleId?`, `metadata` JSON

#### AutomationRule / AutomationRun
- Rule: `workflowType`, `trigger` JSON, `steps` JSON, `status`
- Run: `ruleId`, mirrored trigger/steps, `result` JSON, lifecycle timestamps

#### Goal / GoalProgress
- Goal: `entityType`, `entityId`, `metric`, `target`, `current`, `period`, optional period bounds
- Progress: append-only `current` readings per goal

#### GraphSnapshot
- Optional rollup: `edgeCount`, `nodeCount`, `summary` JSON — no duplicate edge storage

---

## Key relations wired

```
Opportunity ↔ OpportunityScore / LeadScore
Person ↔ LeadScore / FanIntelligenceSnapshot
Artist ↔ SuggestedOpportunity / ArtistHealthSnapshot / FanIntelligenceSnapshot
Community ↔ CommunityIntelligenceSnapshot
RecommendationRule ↔ RecommendationCandidate (optional ruleId)
AutomationRule ↔ AutomationRun
Goal ↔ GoalProgress
Relationship — unchanged (EcosystemGraphEdge via helper)
```

---

## Package updates

### `@tsc/database`

| File | Purpose |
|------|---------|
| `src/intelligence.ts` | Phase 5 domain exports, includes, where helpers, `EcosystemGraphEdge` mapper |
| `src/index.ts` | Re-export `intelligence.js` |
| `src/opportunity.ts` | Extended `OPPORTUNITY_MODELS` |
| `src/analytics.ts` | Extended `ANALYTICS_MODELS` |
| `src/recommendation.ts` | Added `RecommendationRule` to model list |

Key exports: `INTELLIGENCE_MODELS`, `toEcosystemGraphEdge`, snapshot unique-where builders, active rule filters.

### `@tsc/types`

Phase 5 section: all enum unions + interfaces for 13 models, `EcosystemGraphEdge`, `GraphSnapshot`. `RecommendationCandidate` extended with `ruleId` + `metadata`.

### `@tsc/contracts`

New `src/intelligence/` module (`enums.ts`, `entities.ts`, `index.ts`) with Zod schemas + create variants. Main index re-exports. Subpath export `./intelligence` added to `package.json`. `RecommendationCandidateSchema` extended.

---

## Verification

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tsc_dev"
npx pnpm --filter @tsc/database prisma:validate
# ✅ The schema at prisma\schema.prisma is valid 🚀

npx pnpm --filter @tsc/database build
# ✅ prisma generate + tsc

npx pnpm --filter @tsc/types build
npx pnpm --filter @tsc/contracts build
# ✅ both pass
```

---

## Migration path

```bash
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DATABASE"
npx pnpm --filter @tsc/database prisma:validate
npx pnpm --filter @tsc/database build
cd packages/database
npx prisma db push
# Or: npx prisma migrate dev --name phase5_ecosystem_intelligence
```

`RecommendationCandidate` gains nullable `ruleId` + `metadata` — additive, no breaking change to existing rows.

---

## Unblocks downstream workers

| Worker | Can proceed with |
|--------|------------------|
| API scoring endpoints | OpportunityScore / LeadScore / FanIntelligenceSnapshot shapes |
| Analytics snapshot jobs | ArtistHealth, CommunityIntelligence, GraphSnapshot upserts |
| Recommendation engine | RecommendationRule metadata + candidate ruleId linkage |
| Automation module | AutomationRule / AutomationRun persistence |
| Goals dashboard | Goal + GoalProgress time series |
| CoreKnot intelligence UI | SuggestedOpportunity, CityRecommendation feeds |

---

## Follow-up (out of scope)

| Item | Notes |
|------|-------|
| Snapshot cron jobs | Models only — no BullMQ wiring |
| `@tsc/api` endpoints | Schema + contracts ready; services not implemented |
| Prisma DB view for `EcosystemGraphEdge` | Code helper sufficient; SQL view optional later |
| `prisma migrate` | Not executed — DB may be unavailable locally |

---

## Not touched

- `.specify/memory/*` (per constraint)
- Phase 2.5–4 models (no removals or breaking FK changes)
- `apps/coreknot` Mongo SoR

---

## Files touched

- `packages/database/prisma/schema.prisma` — Phase 5 enums + 13 models + candidate extension
- `packages/database/src/intelligence.ts` — new domain module
- `packages/database/src/index.ts` — re-export
- `packages/database/src/opportunity.ts` — model constants
- `packages/database/src/analytics.ts` — model constants
- `packages/database/src/recommendation.ts` — model constants
- `packages/types/src/index.ts` — Phase 5 types + candidate extension
- `packages/contracts/src/intelligence/*` — new Zod module
- `packages/contracts/src/index.ts` — re-export + candidate schema
- `packages/contracts/package.json` — `./intelligence` export
- `.agents/database-phase5-report.md` (this file)
