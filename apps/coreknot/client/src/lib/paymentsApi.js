import { apiGet, apiPost, apiPatch, resolveApiPath } from './apiClient';

function paymentsPath(segment = '') {
  return resolveApiPath('/api/payments', segment);
}

export function getTscPaymentsApiBase() {
  const base = resolveApiPath('/api/payments', '');
  return base.replace(/\/api\/payments$/, '') || '';
}

export const INVOICE_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const PAYMENT_PROVIDER_LABELS = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  cashfree: 'Cashfree',
  manual: 'Manual',
};

export function fetchPaymentsDashboard(params = {}) {
  return apiGet(paymentsPath('/dashboard'), { params });
}

export function fetchSettlements(params = {}) {
  return apiGet(paymentsPath('/settlements'), { params });
}

export function fetchArtistPayouts(artistId) {
  return apiGet(paymentsPath(`/payouts/artist/${artistId}`));
}

export function collectInvoice(invoiceId, body = {}) {
  return apiPost(paymentsPath(`/invoices/${invoiceId}/collect`), body);
}

export function markInvoicePaid(invoiceId, body = {}) {
  return apiPost(paymentsPath(`/invoices/${invoiceId}/mark-paid`), body);
}

export function holdEscrow(dealId, body) {
  return apiPost(paymentsPath(`/escrow/${dealId}/hold`), body);
}

export function schedulePayout(body) {
  return apiPost(paymentsPath('/payouts'), body);
}
