# Rewards UI — route integration

Add to CoreKnot client router (dashboard or passport section):

```jsx
import RewardsCatalogPage from './pages/rewards/RewardsCatalogPage';
import MyRedemptionsPage from './pages/rewards/MyRedemptionsPage';

<Route path="/rewards" element={<RewardsCatalogPage />} />
<Route path="/rewards/redemptions" element={<MyRedemptionsPage />} />
```

Optional nav link under fan/passport area:

```jsx
{ label: 'Rewards', path: '/rewards', icon: Gift }
```
