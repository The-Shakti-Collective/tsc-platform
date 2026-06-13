# Phase 13 Module 2 — Skill Graph (CON)

**Status:** Complete (implementation)  
**Date:** 2026-06-12  
**Depends on:** Phase 13 Module 1 (CreativeIdentity), Person graph, Activity

## Summary

Module 2 replaces `capabilities[]` string stubs with a structured **Skill Graph**: canonical skills catalog, proficiency junction on `CreativeIdentity`, peer endorsements, discovery endpoints, and CoreKnot editor/discovery UI. Proficiency is rule-based from years of experience (no ML). ~20 canonical skills seed on first API bootstrap when the `Skill` table is empty.

**Out of scope (Module 3+):** Service Marketplace, Portfolio, full Talent Discovery, Team Assembly, Creator Reputation engine, Project Economy.

---

## Schema

**File:** `packages/database/prisma/phase13-module2.prisma`

| Model / enum | Purpose |
|--------------|---------|
| `Skill` | Canonical capability node (`slug`, `name`, `category`, `isActive`) |
| `CreativeIdentitySkill` | Junction with `proficiency`, `yearsExperience`, `isPrimary` |
| `SkillEndorsement` | Peer/project/system endorsement with `weight` |
| `SkillCategory` | production, performance, visual, management, technical, marketing |
| `SkillProficiency` | learning, intermediate, expert |
| `SkillEndorsementSource` | peer, project, system |

**Graph (optional merge):** `HAS_SKILL` edge `CreativeIdentity → Skill` via `Relationship` table when enums merged.

**Seed:** `CANONICAL_SKILLS` in `packages/database/src/skills.ts` (20 skills).

**Compat:** `capabilities[]` column retained; API maps primary skill slugs into `capabilities` for legacy consumers.

---

## API

### `skills` module — `apps/api/src/modules/skills/`

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/skills` | Public | Browse/filter `?category=` |
| GET | `/skills/:slug` | Public | Skill detail + creator count |
| GET | `/skills/:slug/creators` | Public | Discovery foundation (`?city=` stub, `?limit=`) |
| POST | `/skills/:slug/endorse` | Stub | Peer endorse `{ creativeIdentitySlug }` |

### `creative-identity` extensions

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/creative-identity/:slug/skills` | Public | Skills + endorsement counts |
| POST | `/creative-identity/me/skills` | Stub | Add skill `{ skillSlug, proficiency?, yearsExperience?, isPrimary? }` |
| DELETE | `/creative-identity/me/skills/:skillId` | Stub | Remove skill |

**Packages:**

- `@tsc/database` — `packages/database/src/skills.ts`
- `@tsc/types` — `packages/types/src/skills.ts`
- `@tsc/contracts` — `packages/contracts/src/skills/index.ts`

**Proficiency rule:** `<3 yrs → learning`, `3–7 → intermediate`, `8+ → expert` (override via explicit `proficiency`).

---

## Activity

| Action | Trigger |
|--------|---------|
| `skill_added` | POST `/creative-identity/me/skills` |
| `skill_endorsed` | POST `/skills/:slug/endorse` |

Extend `ActivityAction` enum + `packages/database/src/activity.ts`.

---

## CoreKnot UI

| File | Route / placement |
|------|-------------------|
| `SkillsEditorSection.jsx` | `CreativeIdentityEditPage` |
| `SkillDiscoveryPage.jsx` | `/discover/skills` |
| `skillsApi.js` | API client + mock fallback |

See `apps/coreknot/client/src/pages/creative-identity/INTEGRATION.module2.patch.md`.

`CreativeIdentityPage` shows structured skills with endorsement counts; legacy capability strings shown only when no skills exist.

---

## Migration steps

1. Merge `phase13-module1.prisma` then `phase13-module2.prisma` into `packages/database/prisma/schema.prisma`
2. Extend `Person`, `CreativeIdentity`, `ActivityAction`
3. Optional: `GraphEntityType` (+CreativeIdentity, +Skill), `RelationshipType` (+HAS_SKILL)
4. `pnpm --filter @tsc/database prisma migrate dev`
5. Register `SkillsModule` via `CreativeIdentityModule` import (already wired)
6. Apply CoreKnot routes per `INTEGRATION.module2.patch.md`
7. Proxy `/api/skills` and `/api/creative-identity/*`

---

## Deliverables

| Artifact | Path |
|----------|------|
| Prisma merge | `packages/database/prisma/phase13-module2.prisma` |
| DB helpers + seed | `packages/database/src/skills.ts` |
| Types | `packages/types/src/skills.ts` |
| Contracts | `packages/contracts/src/skills/index.ts` |
| API module | `apps/api/src/modules/skills/` |
| Creative identity wiring | controller/service/mapper updates |
| UI | `SkillsEditorSection`, `SkillDiscoveryPage`, `skillsApi.js` |
| Integration notes | `INTEGRATION.module2.patch.md` |
| This report | `.agents/phase13-module2-report.md` |

---

## Deferred to Module 3

- **Service Marketplace** — monetized skill listings
- **Portfolio** — work samples linked to skills
- **Talent Discovery expansion** — geo radius, ranking, alerts (city filter stub only in Module 2)
- **Project/system endorsements** — `source: project|system` wiring from deliverables
- **Team Assembly** — crew matching by skill graph
- **Creator Reputation (Module 7)** — endorsement weight aggregation into trust score
- **Drop `capabilities[]` column** — after all consumers migrated

---

## Test checklist

- [ ] `GET /skills` returns ~20 canonical skills on empty DB
- [ ] `GET /skills?category=visual` filters correctly
- [ ] `POST /creative-identity/me/skills` adds junction + activity `skill_added`
- [ ] Proficiency auto-derived from `yearsExperience` when omitted
- [ ] `DELETE /creative-identity/me/skills/:skillId` removes skill
- [ ] `GET /creative-identity/:slug/skills` shows endorsement counts
- [ ] `POST /skills/:slug/endorse` creates peer endorsement + activity `skill_endorsed`
- [ ] Duplicate peer endorsement returns 409
- [ ] `GET /skills/:slug/creators?city=Mumbai` filters (stub)
- [ ] `CreativeIdentityEditPage` SkillsEditorSection add/remove works (mock + live)
- [ ] `/discover/skills` browse + creator list renders
- [ ] Public creative profile shows skills instead of capability strings
- [ ] Optional `HAS_SKILL` graph edge created on skill add (when enum merged)
