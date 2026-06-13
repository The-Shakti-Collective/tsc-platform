# CoreKnot Phase 10.2 — Contract routes

Merge into `App.jsx`:

```jsx
import ContractListPage from './pages/contract/ContractListPage';

<Route path="/contracts" element={<ContractListPage />} />
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Contracts', path: '/contracts', roles: ['artist', 'manager', 'admin', 'brand'] },
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/contracts` and `/api/contracts/*`
- `/api/artists/:id/contracts`
- `/api/brands/:id/contracts`

Deal pipeline link: when deal advances to `agreement`, TSC auto-creates contract draft — visible here after API refresh.
