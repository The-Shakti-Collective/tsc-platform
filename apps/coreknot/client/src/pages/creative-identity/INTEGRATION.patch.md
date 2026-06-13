# CoreKnot Phase 13 Module 1 — Creative Identity routes

Merge into `App.jsx`:

```jsx
import CreativeIdentityPage from './pages/creative-identity/CreativeIdentityPage';
import CreativeIdentityEditPage from './pages/creative-identity/CreativeIdentityEditPage';

<Route path="creator/:slug" element={<CreativeIdentityPage />} />
<Route path="creative/:slug" element={<CreativeIdentityPage />} />
<Route path="settings/creative-identity" element={<CreativeIdentityEditPage />} />
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/creative-identity` and `/api/creative-identity/*`

## Backward compatibility

Existing routes remain unchanged:

| Legacy route | Creative identity |
|--------------|-------------------|
| `/profile/:slug` | Merges `creativeIdentity` summary in API response |
| `/passport/:slug` | Ecosystem passport unchanged; link footer on creative page |

Public creative identity API:

| Method | Route |
|--------|-------|
| GET | `/creative-identity/me` |
| PATCH | `/creative-identity/me` |
| GET | `/creative-identity/:slug/public` |
| GET | `/creative-identity/:slug/roles` |
| POST | `/creative-identity/me/roles` |
| DELETE | `/creative-identity/me/roles/:roleId` |

## Migration

1. Merge `packages/database/prisma/phase13-module1.prisma` into `schema.prisma`
2. Run `pnpm --filter @tsc/database prisma migrate dev`
3. Apply routes above
4. Identity resolve auto-provisions `CreativeIdentity` from `PersonProfile`

## Deferred to Module 2

- Skill Graph (capabilities become structured skills)
- Full trust score (Module 7)
- `creator` TSC namespace enum (optional migration)
