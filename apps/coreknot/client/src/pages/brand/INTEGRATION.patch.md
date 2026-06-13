# CoreKnot Phase 7 Month 1 — Brand OS routes

Merge into `App.jsx`:

```jsx
import BrandListPage from './pages/brand/BrandListPage';
import BrandDetailPage from './pages/brand/BrandDetailPage';

<Route path="/brands" element={<BrandListPage />} />
<Route path="/brands/:brandId" element={<BrandDetailPage />} />
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Brands', path: '/brands', roles: ['artist', 'manager', 'admin', 'brand'] },
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/brands`
- `/api/brands/*`
- `/api/agencies` and `/api/agencies/*` (Agency OS API — UI deferred)
- `/api/labels` and `/api/labels/*` (Label OS API — UI deferred)
