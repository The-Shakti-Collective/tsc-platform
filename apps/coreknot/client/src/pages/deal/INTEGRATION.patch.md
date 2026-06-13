# CoreKnot Phase 7 Month 3 — Deal Pipeline routes

Merge into `App.jsx`:

```jsx
import DealPipelinePage from './pages/deal/DealPipelinePage';
import DealDetailPage from './pages/deal/DealDetailPage';

<Route path="/deals" element={<DealPipelinePage />} />
<Route path="/deals/:dealId" element={<DealDetailPage />} />
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Deals', path: '/deals', roles: ['artist', 'manager', 'admin', 'brand'] },
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/deals` and `/api/deals/*`
- `/api/marketplace/listings` and `/api/marketplace/search` (Month 2)
