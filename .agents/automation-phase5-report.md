# Automation Phase 5 Report — Domains 8 & 9

**Agent:** Implementer-Automation  
**Date:** 2026-06-12  
**Scope:** Automation engine + goal tracking on `@tsc/api`  
**Status:** Complete (module shipped; build requires full monorepo checkout)

## Summary

Phase 5 Domains 8 & 9 implemented in `apps/api/src/modules/intelligence/` — **AutomationRule CRUD**, **POST trigger stubs** for three workflows, **Goal CRUD**, and **GET goals dashboard** with current/target/gap/projection per entity. Wired to existing `Opportunity`, `Person`, `Community`, `LeadScore` models. Every trigger persists an `AutomationRun` row with step log JSON. No external integrations (email, tasks, WhatsApp) — all side effects logged/stubbed.

Schema aligned with database agent Phase 5 models (`AutomationRule`, `AutomationRun`, `Goal`, `GoalProgress`). Extended `AutomationRun` with optional `ruleId` and FK links to `opportunityId`, `personId`, `communityId`.

---

## Route inventory

### Automation (`/api/intelligence/automation`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/rules` | List rules (`workflowType`, `status`, `limit`) |
| GET | `/rules/:id` | Get rule by id |
| POST | `/rules` | Create rule |
| PATCH | `/rules/:id` | Update rule |
| DELETE | `/rules/:id` | Delete rule |
| POST | `/trigger` | Execute workflow stub → `AutomationRun` |

### Goals (`/api/intelligence/goals`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | Per-entity goals with current/target/gap/projection/onTrack |
| GET | `/` | List goals (filter by entity, period) |
| GET | `/:id` | Get goal |
| POST | `/` | Create goal |
| PATCH | `/:id` | Update goal |
| DELETE | `/:id` | Delete goal |

Auth: `StubAuthGuard` on all routes (dev headers).

---

## Workflow stubs (`POST /api/intelligence/automation/trigger`)

Body: `{ workflowType, ruleId?, payload?, personId?, artistId?, communityId?, opportunityId? }`

| workflowType | Steps (logged in `AutomationRun.steps`) | DB wiring |
|--------------|----------------------------------------|-----------|
| `artist_path` | submission → score → assign → task → follow-up | Creates `LeadScore` when `personId` present |
| `booking_inquiry` | inquiry → match → pricing → opportunity → assign | Creates `Opportunity` + `OpportunityActivity` |
| `workshop_lead` | purchase → person → community → recommend_workshop | Validates `Person`/`Community`; upserts `CommunityMember` |

All workflows return `{ run, workflowType, stubbed: true }`. Failed runs set `status: failed` and `errorMessage`.

---

## Goal dashboard

`GET /api/intelligence/goals/dashboard?entityType=&entityId=`

Response shape:

- `entities[]` — grouped by `entityType:entityId`
- Each goal: `current`, `target`, `gap`, `projection` (linear run-rate to `periodEnd`), `progressPercent`, `onTrack`
- `summary`: `totalGoals`, `onTrack`, `atRisk`, `completed`

---

## Module layout

```
apps/api/src/modules/intelligence/
├── intelligence.module.ts
├── automation.controller.ts
├── automation.service.ts
├── automation.repository.ts   # AutomationRepository + GoalRepository
├── goal.controller.ts
├── goal.service.ts
├── dto.ts
├── schema/index.ts
└── types/index.ts
```

Registered in `apps/api/src/app.module.ts` as `IntelligenceModule`.

---

## Schema / package touchpoints

| File | Change |
|------|--------|
| `packages/database/prisma/schema.prisma` | Deduped Phase 5 enums; `AutomationRun.ruleId` optional; FKs to Opportunity/Person/Community; optional `Goal.name` |
| `packages/database/src/intelligence.ts` | Added `automationRunInclude` |

Uses `@tsc/database` helpers: `automationRuleInclude`, `goalWithProgressInclude`.

---

## Build verification

Run from monorepo root (requires `package.json`, `pnpm-lock.yaml`, full `apps/api` scaffold):

```bash
npx pnpm@9.15.0 --filter @tsc/database prisma:generate
npx pnpm@9.15.0 --filter @tsc/database build
npx pnpm@9.15.0 --filter @tsc/api build
```

Local agent workspace snapshot lacked root `package.json` — build not executed in isolation.

---

## Intentionally not done

- No SQL migrations applied
- No `.specify/memory/*` edits
- No external task/email/WhatsApp dispatch
- `IntelligenceService` (ecosystem scoring endpoints) left for parallel API agent — separate from automation/goal surface
- No E2E tests

---

## Example requests

```http
POST /api/intelligence/automation/trigger
Content-Type: application/json

{
  "workflowType": "booking_inquiry",
  "personId": "person-123",
  "artistId": "artist-456",
  "payload": { "title": "Corporate gig enquiry", "budget": 120000 }
}
```

```http
POST /api/intelligence/goals
Content-Type: application/json

{
  "name": "Q2 follower target",
  "entityType": "Artist",
  "entityId": "artist-456",
  "metric": "followers",
  "target": 5000,
  "current": 3200,
  "period": "quarterly",
  "periodStart": "2026-04-01T00:00:00.000Z",
  "periodEnd": "2026-06-30T23:59:59.999Z"
}
```

---

## Next steps

1. Wire CoreKnot operating UI to `/api/intelligence/automation/*` and `/api/intelligence/goals/*`
2. Replace stub assign/task/follow-up steps with Taskmaster queue jobs when integrations land
3. Export automation/goal Zod schemas from `@tsc/contracts`
4. Apply Prisma migration for `AutomationRun` FK columns
