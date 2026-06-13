import { apiGet, apiPost, apiPatch, resolveApiPath } from './apiClient';

function bookingPath(segment = '') {
  return resolveApiPath('/api/booking', segment);
}

export function getTscBookingApiBase() {
  const base = resolveApiPath('/api/booking', '');
  return base.replace(/\/api\/booking$/, '') || '';
}

export const BOOKING_STATUS_LABELS = {
  inquiry: 'Inquiry',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const BOOKING_STATUS_ORDER = ['inquiry', 'negotiating', 'confirmed', 'completed', 'cancelled'];

export async function fetchBookingInquiries(params = {}) {
  return apiGet(bookingPath(''), { params });
}

export async function fetchBookingInquiry(id) {
  return apiGet(bookingPath(`/${id}`));
}

export async function createBookingInquiry(body) {
  return apiPost(bookingPath(''), body);
}

export async function advanceBookingStatus(id) {
  return apiPatch(bookingPath(`/${id}/advance`), {});
}

export async function convertBookingToDeal(id) {
  return apiPost(bookingPath(`/${id}/convert-to-deal`), {});
}

export function groupInquiriesByStatus(items = []) {
  const grouped = {};
  BOOKING_STATUS_ORDER.forEach((status) => {
    grouped[status] = items.filter((item) => item.status === status);
  });
  return grouped;
}
