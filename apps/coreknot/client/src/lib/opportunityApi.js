import { apiGet, apiPost, resolveApiPath } from './apiClient';

function opportunityPath(segment = '') {
  return resolveApiPath('/api/opportunities', segment);
}

export function getTscOpportunityApiBase() {
  const base = resolveApiPath('/api/opportunities', '');
  return base.replace(/\/api\/opportunities$/, '') || '';
}

export const OPPORTUNITY_CATEGORIES = [
  'festival',
  'residency',
  'brand',
  'grant',
  'collaboration',
  'workshop',
];

export const CATEGORY_LABELS = {
  festival: 'Festival',
  residency: 'Residency',
  brand: 'Brand',
  grant: 'Grant',
  collaboration: 'Collaboration',
  workshop: 'Workshop',
};

export const APPLICATION_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export async function fetchMarketplace(filters = {}) {
  return apiGet(opportunityPath('/marketplace'), { params: filters });
}

export async function fetchOpportunityDetail(id) {
  return apiGet(opportunityPath(`/${encodeURIComponent(id)}`));
}

export async function fetchSuggestedOpportunities(artistId) {
  return apiGet(resolveApiPath('/api/intelligence/opportunities/suggested'), {
    params: { artistId },
  });
}

export async function saveOpportunity(id, body = {}) {
  return apiPost(opportunityPath(`/${encodeURIComponent(id)}/save`), body);
}

export async function applyToOpportunity(id, body = {}) {
  return apiPost(opportunityPath(`/${encodeURIComponent(id)}/apply`), body);
}

export async function shareOpportunity(id, body = {}) {
  return apiPost(opportunityPath(`/${encodeURIComponent(id)}/share`), body);
}

export async function fetchArtistApplications(artistId, filters = {}) {
  return apiGet(resolveApiPath(`/api/artists/${artistId}/applications`), { params: filters });
}
