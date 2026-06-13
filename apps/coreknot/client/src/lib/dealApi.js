import { apiGet, apiPost, apiPatch, resolveApiPath } from './apiClient';

function dealPath(segment = '') {
  return resolveApiPath('/api/deals', segment);
}

export function getTscDealApiBase() {
  const base = resolveApiPath('/api/deals', '');
  return base.replace(/\/api\/deals$/, '') || '';
}

export const DEAL_STATUS_LABELS = {
  inquiry: 'Inquiry',
  negotiating: 'Negotiating',
  contracted: 'Contracted',
  in_progress: 'In Progress',
  completed: 'Completed',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const DEAL_STATUS_ORDER = [
  'inquiry',
  'negotiating',
  'contracted',
  'in_progress',
  'completed',
  'paid',
  'cancelled',
];

export const REVENUE_TYPE_LABELS = {
  performance: 'Performance',
  brand: 'Brand',
  licensing: 'Licensing',
  merchandise: 'Merchandise',
  other: 'Other',
};

export async function fetchDeals(params = {}) {
  return apiGet(dealPath(''), { params });
}

export async function fetchArtistDeals(artistId, params = {}) {
  return apiGet(resolveApiPath(`/api/artists/${encodeURIComponent(artistId)}/deals`), { params });
}

export async function fetchDeal(id) {
  return apiGet(dealPath(`/${id}`));
}

export async function advanceDealStatus(id) {
  return apiPost(dealPath(`/${id}/advance`), {});
}

export async function updateDeal(id, body) {
  return apiPatch(dealPath(`/${id}`), body);
}

export async function fetchDealRevenue(id) {
  return apiGet(dealPath(`/${id}/revenue`));
}

export async function recordDealRevenue(id, body) {
  return apiPost(dealPath(`/${id}/revenue`), body);
}

export function groupDealsByStatus(items = []) {
  const grouped = {};
  DEAL_STATUS_ORDER.forEach((status) => {
    grouped[status] = items.filter((item) => item.status === status);
  });
  return grouped;
}
