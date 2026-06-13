import { apiGet, apiPost, resolveApiPath } from './apiClient';

function marketplacePath(segment = '') {
  return resolveApiPath('/api/marketplace', segment);
}

export function getTscMarketplaceApiBase() {
  const base = resolveApiPath('/api/marketplace', '');
  return base.replace(/\/api\/marketplace$/, '') || '';
}

export const LISTING_TYPE_LABELS = {
  brand_campaign: 'Brand campaign',
  festival_slot: 'Festival slot',
  residency: 'Residency',
  collaboration: 'Collaboration',
  workshop: 'Workshop',
};

export const LISTING_TYPES = Object.keys(LISTING_TYPE_LABELS);

export const BRAND_REVIEW_ACTIONS = {
  approve: 'Approve',
  reject: 'Reject',
  request_info: 'Request info',
};

export async function fetchMarketplaceListings(filters = {}) {
  return apiGet(marketplacePath('/listings'), { params: filters });
}

export async function searchMarketplaceListings(filters = {}) {
  return apiGet(marketplacePath('/search'), { params: filters });
}

export async function trackListing(listingId, body = {}) {
  return apiPost(marketplacePath(`/listings/${listingId}/track`), body);
}
