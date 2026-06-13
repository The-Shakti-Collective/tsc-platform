# CoreKnot Phase 6 — Marketplace integration patch

Merge into `App.jsx` (operating routes section):

```jsx
import OpportunityMarketplacePage from './pages/operating/opportunities/OpportunityMarketplacePage';
import OpportunityDetailPage from './pages/operating/opportunities/OpportunityDetailPage';

<Route path="opportunities/marketplace" element={<OpportunityMarketplacePage />} />
<Route path="opportunities/:opportunityId" element={<OpportunityDetailPage />} />
```

Merge into `navPageAccess.js`:

```js
import { PHASE6_MARKETPLACE_NAV_PATH_ACCESS, PHASE6_MARKETPLACE_NAV_PATH_PREFIXES } from './navPageAccess.phase6-marketplace';
// spread into pathAccess map and prefix list
```

Proxy (Vite / CoreKnot server): forward `/api/opportunities/*` and `/api/artists/*/applications` to `@tsc/api`.
