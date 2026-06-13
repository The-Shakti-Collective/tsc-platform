# Phase 8 Step 8 — Fan Commerce routes

Add to CoreKnot client router:

```jsx
import FanCommerceBrowsePage from './pages/commerce/FanCommerceBrowsePage';

<Route path="/commerce" element={<FanCommerceBrowsePage />} />
```

Optional nav link from passport or artist workspace:

```jsx
<Link to="/commerce">Browse fan commerce</Link>
```
