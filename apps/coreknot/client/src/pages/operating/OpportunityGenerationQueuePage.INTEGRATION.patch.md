# Phase 14 Module 1 — CoreKnot route integration

## App router (lazy import)

```javascript
const OpportunityGenerationQueuePage = lazyWithRetry(() =>
  import('./pages/operating/OpportunityGenerationQueuePage'),
);
```

## Routes (under `PageRoute page="dashboard"` or admin shell)

```jsx
<Route path="/operating/opportunity-generation" element={<OpportunityGenerationQueuePage />} />
<Route path="/operating/analytics/opportunity-generation" element={<OpportunityGenerationQueuePage />} />
```

## ExecutiveCommandCenterPage.jsx

Import and place below actionable insights or beside ForecastPanel:

```jsx
import HotSignalsPanel from '../../components/opportunity-generation/HotSignalsPanel';

// Inside page layout grid:
<HotSignalsPanel limit={5} />
```

Optional header link:

```jsx
<Link to="/operating/opportunity-generation" className="text-xs text-[var(--color-brand-primary)]">
  Opportunity generation →
</Link>
```
