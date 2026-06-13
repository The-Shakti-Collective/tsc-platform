# Phase 6.5 Sprint 5 (FINAL) — Ecosystem Activation Layer

**Agent:** Implementer-Phase6.5-Sprint5  
**Date:** 2026-06-12  
**Status:** Complete (implementation)

## Summary

Sprint 5 closes Phase 6.5 with **Reputation System V1**, **Ecosystem Credits ledger**, **Participation-based Discovery Engine**, and **Command Center participation upgrade**. All scoring aggregates existing participation data (events, communities, collaborations, opportunities) via rule-based weights — no new ML/analytics package. Credits earn hooks wired into Sprint 2–4 handlers. Discovery ranks/surfaces via graph + profile fields; optionally enriches from `/intelligence/recommendations/*`.

---

## Module 7 — Reputation System V1

### Schema fragment

`packages/database/prisma/phase6.5-reputation.prisma`

| Model / enum | Purpose |
|--------------|---------|
| `ReputationEntityType` | Person, Artist, Community |
| `ReputationSnapshot` | entityType, entityId, snapshotDate, role scores, scores JSON, overallScore, rankPercentile |
| `EcosystemCredit` | personId, balance, lifetimeEarned, lifetimeSpent |
| `EcosystemCreditTransaction` | personId, amount, reason, referenceType, referenceId |

### Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/reputation.ts`, `src/credits.ts` |
| `@tsc/types` | `src/reputation.ts`, `src/credits.ts` |
| `@tsc/contracts` | `src/reputation/index.ts`, `src/credits/index.ts` |

### API (`apps/api/src/modules/reputation`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/reputation/person/:id` | StubAuthGuard | Latest person reputation snapshot |
| GET | `/reputation/community/:id` | StubAuthGuard | Latest community reputation snapshot |
| POST | `/reputation/refresh/:entityType/:entityId` | Admin | Recompute + persist snapshot |

**Scoring (`reputation.service.ts`):**

- `computePersonReputation` — EventParticipation checked-in, CommunityMember active, CollaborationApplication accepted, OpportunityApplication won, activity count, retention stub, attendance ratio
- `computeCommunityReputation` — member activity, retention stub, events count
- `computeOrganizerReputation` — events organized + attendance
- Updates `PersonProfile.reputationScore` + `ecosystemScore` cache on person compute

**Weights:** events 15%, communities 10%, collaborations 20%, opportunitySuccess 25%, memberActivity 10%, retention 5%, attendance 10%, reviews 5% (stub 0)

---

## Module 9 — Ecosystem Credits

### API (`apps/api/src/modules/credits`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/credits/me` | StubAuthGuard | Balance + lifetime totals |
| GET | `/credits/me/history` | StubAuthGuard | Transaction ledger |
| POST | `/credits/earn` | Internal/admin | Idempotent earn by reason |

**Earn rules (`CREDIT_EARN_RULES`):**

| Reason | Amount | Hook |
|--------|--------|------|
| `attend_event` | +10 | `EventService.checkIn()` |
| `join_community` | +5 | `CommunityService.join()` (first join) |
| `complete_collaboration` | +25 | `CollaborationService.updateApplication()` accept |
| `complete_opportunity` | +50 | `OpportunityService.updateArtistApplicationStatus()` won |
| `help_member` | +15 | Stub — Phase 7 |

No spend/redemption — Phase 7 perks.

---

## Module 10 — Discovery Engine

### API (`apps/api/src/modules/discovery`)

| Method | Route | Purpose |
|--------|------|---------|
| GET | `/discovery/people` | Shared communities, genres, city; exclude connected/following |
| GET | `/discovery/communities` | Genres, city, friends' memberships |
| GET | `/discovery/events` | City + past attendance; optional `/intelligence/recommendations/events` enrichment |
| GET | `/discovery/collaborations` | PersonProfile.skills → Collaboration.type match |

**CoreKnot client:** `discoveryApi.js`, `hooks/queries/discovery.js` (mock fallback)

---

## Command Center Upgrade

### Backend

Extended `IntelligenceService` + `ParticipationAnalyticsRepository`:

| Metric | Source |
|--------|--------|
| Daily Active Members | CommunityMember active, updatedAt 30d stub |
| New Collaborations | Activity `posted_collaboration` 7d/30d |
| Community Growth | CommunityMember joins in period |
| Participation Rate | active members / total members |
| Top Contributors | Activity actor groupBy count |
| Ecosystem Health | avg `PersonProfile.reputationScore` |

| Method | Route |
|--------|-------|
| GET | `/intelligence/participation-dashboard?period=weekly\|monthly` |
| GET | `/intelligence/command-center` | Now includes `participation` block |

### CoreKnot UI

`ExecutiveCommandCenterPage.jsx` — new **Ecosystem Participation** section (6 KPI tiles + Top Contributors list). `intelligenceApi.js` mock updated.

---

## Credit earn hooks (Sprint 2–4)

| Handler | File | Trigger |
|---------|------|---------|
| Community join | `community.service.ts` | `!wasActive` after join |
| Event check-in | `event.service.ts` | After successful check-in |
| Collab accept | `collaboration.service.ts` | `status === 'accepted'` |
| Opportunity won | `opportunity.service.ts` | New `PATCH /artists/:artistId/applications/:applicationId` → `won` |

---

## Files created

```
packages/database/prisma/phase6.5-reputation.prisma
packages/database/src/reputation.ts
packages/database/src/credits.ts
packages/types/src/reputation.ts
packages/types/src/credits.ts
packages/types/src/discovery.ts
packages/contracts/src/reputation/index.ts
packages/contracts/src/credits/index.ts
packages/contracts/src/discovery/index.ts
apps/api/src/modules/reputation/reputation.module.ts
apps/api/src/modules/reputation/reputation.controller.ts
apps/api/src/modules/reputation/reputation.service.ts
apps/api/src/modules/reputation/reputation.repository.ts
apps/api/src/modules/credits/credits.module.ts
apps/api/src/modules/credits/credits.controller.ts
apps/api/src/modules/credits/credits.service.ts
apps/api/src/modules/credits/credits.repository.ts
apps/api/src/modules/discovery/discovery.module.ts
apps/api/src/modules/discovery/discovery.controller.ts
apps/api/src/modules/discovery/discovery.service.ts
apps/api/src/modules/discovery/discovery.repository.ts
apps/api/src/modules/intelligence/participation-analytics.repository.ts
apps/coreknot/client/src/lib/discoveryApi.js
apps/coreknot/client/src/hooks/queries/discovery.js
.agents/phase6.5-sprint5-report.md
.agents/phase6.5-final-report.md
```

## Files changed

```
packages/database/src/index.ts
packages/types/src/index.ts
packages/contracts/src/index.ts
packages/contracts/package.json
apps/api/src/app.module.ts
apps/api/src/modules/intelligence/intelligence.module.ts
apps/api/src/modules/intelligence/intelligence.controller.ts
apps/api/src/modules/intelligence/intelligence.service.ts
apps/api/src/modules/intelligence/types/index.ts
apps/api/src/modules/community/community.module.ts
apps/api/src/modules/community/community.service.ts
apps/api/src/modules/event/event.module.ts
apps/api/src/modules/event/event.service.ts
apps/api/src/modules/collaboration/collaboration.module.ts
apps/api/src/modules/collaboration/collaboration.service.ts
apps/api/src/modules/opportunity/opportunity.module.ts
apps/api/src/modules/opportunity/opportunity.service.ts
apps/api/src/modules/opportunity/opportunity.controller.ts
apps/api/src/modules/opportunity/opportunity.repository.ts
apps/api/src/modules/opportunity/schema/index.ts
apps/coreknot/client/src/lib/intelligenceApi.js
apps/coreknot/client/src/pages/operating/ExecutiveCommandCenterPage.jsx
```

---

## Single migration — schema fragments (all Phase 6.5)

Merge in order into canonical `schema.prisma`:

| # | Fragment | Sprint |
|---|----------|--------|
| 1 | `phase6.5-profile.prisma` | 1 |
| 2 | `phase6.5-membership.prisma` | 2 |
| 3 | `phase6.5-participation.prisma` | 2 |
| 4 | `phase6.5-activity.prisma` | 3 |
| 5 | `phase6.5-collaboration.prisma` | 4 |
| 6 | `phase6.5-reputation.prisma` | 5 |

### Person relation extensions (cumulative)

```prisma
profile                 PersonProfile?
verificationRequests    PersonVerificationRequest[]
communityMemberships    CommunityMember[]
eventParticipations     EventParticipation[]
activities              Activity[]     @relation("PersonActivities")
following               PersonFollow[] @relation("PersonFollowing")
followers               PersonFollow[] @relation("PersonFollowers")
collaborationsCreated   Collaboration[] @relation("CollaborationCreator")
collaborationApplications CollaborationApplication[] @relation("CollaborationApplicant")
ecosystemCredit         EcosystemCredit?
```

### Merge command

```bash
pnpm --filter @tsc/database prisma migrate dev --name phase6_5_ecosystem_activation
pnpm --filter @tsc/contracts build && pnpm --filter @tsc/database build && pnpm --filter @tsc/types build
```

Proxy routes in CoreKnot dev server: `/api/reputation/*`, `/api/credits/*`, `/api/discovery/*`, `/api/intelligence/participation-dashboard`.

---

## Phase 7 readiness

| Ready now | Deferred Phase 7 |
|-----------|------------------|
| Reputation snapshots + profile cache | ML reputation, review ingestion |
| Credit ledger + earn hooks | Spend/redemption, perks catalog |
| Discovery participation ranking | Full recommendation engine merge |
| Command Center participation KPIs | Real-time dashboards, cron refresh jobs |
| `help_member` credit stub | Peer-help workflow + earn trigger |
| Admin reputation refresh endpoint | Scheduled reputation cron job |

**Phase 7 entry points:** `EcosystemCredit.balance`, `ReputationSnapshot.overallScore`, `POST /credits/earn`, `GET /discovery/*`, participation dashboard aggregates.

---

## Verification

1. Merge all 6 prisma fragments → single migration
2. `POST /reputation/refresh/Person/:id` (admin) → profile scores update
3. Join community / check in event / accept collab / mark opportunity won → credits ledger entries
4. `GET /discovery/people` → ranked suggestions with mock fallback in CoreKnot
5. Command Center → Ecosystem Participation section renders weekly/monthly
