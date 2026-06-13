import { apiGet, apiPost, resolveApiPath } from './apiClient';

function commercePath(segment = '') {
  return resolveApiPath('/api/commerce', segment);
}

export const PRODUCT_TYPE_LABELS = {
  ticket: 'Ticket',
  merch: 'Merch',
  experience: 'Experience',
  digital: 'Digital',
};

export function formatPrice(amount, currency = 'INR') {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function fetchTickets(eventId) {
  return apiGet(commercePath(`/events/${eventId}/tickets`));
}

export async function fetchMerch(artistId, communityId) {
  return apiGet(commercePath('/merch'), { params: { artistId, communityId } });
}

export async function fetchExperiences(artistId) {
  return apiGet(commercePath(`/artists/${artistId}/experiences`));
}

export async function purchaseTicket(ticketId) {
  return apiPost(commercePath(`/tickets/${ticketId}/purchase`));
}

export async function purchaseMerch(productId) {
  return apiPost(commercePath(`/merch/${productId}/purchase`));
}

export async function purchaseExperience(experienceId) {
  return apiPost(commercePath(`/experiences/${experienceId}/purchase`));
}

export async function fetchMyPurchases(limit = 50) {
  return apiGet(commercePath('/me/purchases'), { params: { limit } });
}
