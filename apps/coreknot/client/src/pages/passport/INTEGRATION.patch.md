# Phase 10.1 — TSC Identity Network public routes

Merge into `App.jsx` (public routes alongside existing passport routes):

```jsx
import EcosystemPassportPage from './pages/passport/EcosystemPassportPage';

<Route path="profile/:slug" element={<EcosystemPassportPage />} />
<Route path="passport/:slug" element={<EcosystemPassportPage />} />
<Route path="a/:slug" element={<EcosystemPassportPage />} />
<Route path="c/:slug" element={<EcosystemPassportPage />} />
<Route path="b/:slug" element={<EcosystemPassportPage />} />
<Route path="f/:slug" element={<EcosystemPassportPage />} />
```

Namespace → alias mapping:

| Handle | UI route |
|--------|----------|
| `artist.tsc/:slug` | `/a/:slug` |
| `community.tsc/:slug` | `/c/:slug` |
| `brand.tsc/:slug` | `/b/:slug` |
| `fan.tsc/:slug` | `/f/:slug` or `/profile/:slug` |

Canonical URL stored on `TscIdentity.canonicalUrl`: `https://tsc.in/{namespace}.tsc/{slug}`

## EcosystemPassportPage

Add identity badges above share actions:

```jsx
import { IdentityBadgeBar } from '../../components/identity/IdentityBadgeBar';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicTscIdentity } from '../../lib/identityNetworkApi';

// inside component — infer namespace from path or default fan
const namespace = location.pathname.startsWith('/a/') ? 'artist' : 'fan';
const { data: tscIdentity } = useQuery({
  queryKey: ['tsc-identity', namespace, slug],
  queryFn: () => fetchPublicTscIdentity(namespace, slug),
  enabled: !!slug,
});

<IdentityBadgeBar
  badges={tscIdentity?.badges ?? []}
  canonicalUrl={tscIdentity?.identity?.canonicalUrl}
  handle={tscIdentity?.identity?.handle}
/>
```

## API proxy

Forward to `@tsc/api`:

- `/api/identity/:namespace/:slug/public`
- `/api/identity/verify/badges/:entityType/:entityId`
- `/api/identity/network/:personId`
- `/api/admin/identity/verify/:entityType/:entityId`

## Marketplace / graph (optional merge)

Listing detail panels can call `fetchVerificationBadges('Brand', brandId)` for seller trust chips.

Graph node payloads can attach `tscIdentity.handle` from `GET /identity/network/:personId`.
