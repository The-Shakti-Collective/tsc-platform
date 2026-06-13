import { apiGet, apiPost, apiPatch, resolveApiPath } from './apiClient';

function fanPath(segment = '') {
  return resolveApiPath('/api/fans', segment);
}

export async function fetchFanProfile(personId) {
  return apiGet(fanPath(`/${personId}/profile`));
}

export async function fetchMyFanProfile() {
  return apiGet(fanPath('/me/profile'));
}

export async function fetchFanScores(personId) {
  return apiGet(fanPath(`/${personId}/scores`));
}

export async function patchMyFanProfile(payload) {
  return apiPatch(fanPath('/me/profile'), payload);
}

export async function followArtist(artistId) {
  return apiPost(fanPath(`/follow/${artistId}`));
}

export async function supportArtist(artistId) {
  return apiPost(fanPath(`/support/${artistId}`));
}

export async function fetchFanGraph(personId) {
  return apiGet(fanPath(`/${personId}/graph`));
}

export async function refreshSuperfan(personId, artistId) {
  return apiPost(fanPath(`/superfan/refresh/${personId}`), null, {
    params: artistId ? { artistId } : undefined,
  });
}

export async function fetchArtistSuperfans(artistId, limit = 100) {
  return apiGet(resolveApiPath(`/api/artists/${artistId}/superfans`), { params: { limit } });
}

export async function fetchArtistSuperfanSegments(artistId) {
  return apiGet(resolveApiPath(`/api/artists/${artistId}/superfan-segments`));
}

export async function fetchArtistFans(artistId, limit = 10) {
  return apiGet(resolveApiPath(`/api/artists/${artistId}/fans`), { params: { limit } });
}

export async function fetchSuperfan(personId, artistId) {
  return apiGet(fanPath(`/${personId}/superfan/${artistId}`));
}
