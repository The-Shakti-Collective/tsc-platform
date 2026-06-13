# CoreKnot Phase 10.3 — Payments routes

Merge into `App.jsx`:

```jsx
import PaymentsDashboardPage from './pages/payments/PaymentsDashboardPage';

<Route path="/payments" element={<PaymentsDashboardPage />} />
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Payments', path: '/payments', roles: ['artist', 'manager', 'admin', 'brand'] },
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/payments` and `/api/payments/*`

Contract detail — add pay stub:

```jsx
import InvoicePayButton from '../components/payments/InvoicePayButton';

<InvoicePayButton
  invoiceId={invoice.id}
  amount={invoice.amount}
  currency={invoice.currency}
  status={invoice.status}
  dealId={contract.dealId}
/>
```

Deal detail — same component when invoice linked to deal.
