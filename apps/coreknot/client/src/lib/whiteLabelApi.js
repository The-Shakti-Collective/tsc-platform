import { apiGet, apiPost, resolveApiPath } from './apiClient';

function whiteLabelPath(segment = '') {
  return resolveApiPath('/api/white-label', segment);
}

export async function fetchWhiteLabelConfig(tenantSlug) {
  return apiGet(whiteLabelPath(`/tenants/${tenantSlug}/config`));
}

export async function fetchWhiteLabelArtists(tenantSlug) {
  return apiGet(whiteLabelPath(`/tenants/${tenantSlug}/artists`));
}

export async function createWhiteLabelTenant(payload) {
  return apiPost(resolveApiPath('/api/admin/white-label/tenants'), payload);
}
