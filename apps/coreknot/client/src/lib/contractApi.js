import { apiGet, apiPost, apiPatch, resolveApiPath } from './apiClient';

function contractPath(segment = '') {
  return resolveApiPath('/api/contracts', segment);
}

export function getTscContractApiBase() {
  const base = resolveApiPath('/api/contracts', '');
  return base.replace(/\/api\/contracts$/, '') || '';
}

export const CONTRACT_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
  cancelled: 'Cancelled',
};

export const CONTRACT_TYPE_LABELS = {
  brand_deal: 'Brand Deal',
  performance: 'Performance',
  workshop: 'Workshop',
  community: 'Community',
};

export async function fetchContractTemplates() {
  return apiGet(contractPath('/templates'));
}

export async function fetchContracts(params = {}) {
  return apiGet(contractPath(''), { params });
}

export async function fetchContract(id) {
  return apiGet(contractPath(`/${id}`));
}

export async function createContract(body) {
  return apiPost(contractPath(''), body);
}

export async function signContract(id) {
  return apiPatch(contractPath(`/${id}/sign`), {});
}

export async function fetchArtistContracts(artistId, params = {}) {
  return apiGet(resolveApiPath(`/api/artists/${artistId}/contracts`), { params });
}
