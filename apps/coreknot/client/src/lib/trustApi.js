import { apiGet, apiPost, resolveApiPath } from './apiClient';

function trustPath(segment = '') {
  return resolveApiPath('/api/trust', segment);
}

function intelligenceV2Path(segment = '') {
  return resolveApiPath('/api/intelligence/recommendations/v2', segment);
}

export async function fetchArtistTrust(artistId) {
  return apiGet(trustPath(`/artist/${encodeURIComponent(artistId)}`));
}

export async function fetchBrandTrust(brandId) {
  return apiGet(trustPath(`/brand/${encodeURIComponent(brandId)}`));
}

export async function postBrandMatch(criteria) {
  return apiPost(intelligenceV2Path('/brand-match'), criteria);
}

export async function postArtistOpportunitiesV2({ artistId, limit = 20 }) {
  return apiPost(intelligenceV2Path('/artist-opportunities'), { artistId, limit });
}
