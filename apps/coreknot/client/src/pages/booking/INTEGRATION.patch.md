# CoreKnot Phase 10.2 — Booking Inquiry routes

Merge into `App.jsx`:

```jsx
import BookingInquiryPage from './pages/booking/BookingInquiryPage';

<Route path="/booking" element={<BookingInquiryPage />} />
<Route path="/booking/inquiries" element={<BookingInquiryPage />} />
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Booking', path: '/booking', roles: ['artist', 'manager', 'admin', 'brand', 'venue'] },
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/booking/inquiries` and `/api/booking/inquiries/*`

Sync hook: after creating inquiry in CoreKnot, call `emitBookingInquiry` from `apps/coreknot/shared/syncClient.js` to trigger Phase 5 `booking_inquiry` automation.
