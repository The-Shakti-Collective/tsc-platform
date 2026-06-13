import { apiGet, apiPatch, resolveApiPath } from './apiClient';

function brandPath(segment = '') {
  return resolveApiPath('/api/brands', segment);
}

export function getTscBrandApiBase() {
  const base = resolveApiPath('/api/brands', '');
  return base.replace(/\/api\/brands$/, '') || '';
}

export const BRAND_STATUS_LABELS = {
  active: 'Active',
  pending: 'Pending',
  archived: 'Archived',
};

export const BUDGET_RANGE_LABELS = {
  under_5l: 'Under ₹5L',
  five_to_25l: '₹5L – ₹25L',
  twenty_five_to_1cr: '₹25L – ₹1Cr',
  over_1cr: 'Over ₹1Cr',
  undisclosed: 'Undisclosed',
};

export async function fetchBrands(params = {}) {
  return apiGet(brandPath(''), { params });
}

export async function fetchBrand(id) {
  return apiGet(brandPath(`/${id}`));
}

export async function fetchBrandCampaigns(id) {
  return apiGet(brandPath(`/${id}/campaigns`));
}

export async function fetchBrandOpportunities(id) {
  return apiGet(brandPath(`/${id}/opportunities`));
}

export async function fetchBrandApplications(brandId, params = {}) {
  return apiGet(brandPath(`/${brandId}/applications`), { params });
}

export async function reviewBrandApplication(brandId, applicationId, action, notes) {
  return apiPatch(brandPath(`/${brandId}/applications/${applicationId}`), { action, notes });
}
