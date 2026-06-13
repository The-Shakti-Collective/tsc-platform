# Phase 8 Step 6 — Support history route

Add to CoreKnot client router:

```jsx
import SupportHistoryPage from './pages/support/SupportHistoryPage';

<Route path="/support/history" element={<SupportHistoryPage />} />
```

Optional nav link from passport fan profile section:

```jsx
<Link to="/support/history">View support history</Link>
```
