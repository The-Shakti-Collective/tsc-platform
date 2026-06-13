# CoreKnot Phase 13 Module 2 — Skill Graph routes

Merge into `App.jsx`:

```jsx
import SkillDiscoveryPage from './pages/creative-identity/SkillDiscoveryPage';

<Route path="discover/skills" element={<SkillDiscoveryPage />} />
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/skills` and `/api/skills/*`
- Existing `/api/creative-identity/*` gains skills sub-routes

## API routes (Module 2)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/skills` | Public | Browse/filter by category |
| GET | `/skills/:slug` | Public | Skill detail + creator count |
| GET | `/skills/:slug/creators` | Public | Find people by capability (`?city=` stub) |
| POST | `/skills/:slug/endorse` | Stub | Peer endorse creator skill |
| GET | `/creative-identity/:slug/skills` | Public | Public skills + endorsement counts |
| POST | `/creative-identity/me/skills` | Stub | Add skill to own profile |
| DELETE | `/creative-identity/me/skills/:skillId` | Stub | Remove skill from profile |

## UI

| File | Purpose |
|------|---------|
| `SkillsEditorSection.jsx` | Embedded on `CreativeIdentityEditPage` |
| `SkillDiscoveryPage.jsx` | `/discover/skills` browse + city filter stub |
| `skillsApi.js` | Client + mock fallback |

## Migration

1. Merge `packages/database/prisma/phase13-module2.prisma` into `schema.prisma` (after module1)
2. Extend `ActivityAction` with `skill_added`, `skill_endorsed`
3. Optional graph merge: `GraphEntityType` +`CreativeIdentity`, +`Skill`; `RelationshipType` +`HAS_SKILL`
4. `pnpm --filter @tsc/database prisma migrate dev`
5. Canonical skills seed on first `GET /skills` when table empty

## Deferred to Module 3

- Service Marketplace
- Full talent discovery (geo/radius, ranking)
- Portfolio linkage
- Project/system endorsement sources
