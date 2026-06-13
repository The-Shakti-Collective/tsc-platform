import { apiGet, resolveApiPath } from './apiClient';

function passportPath(segment = '') {
  return resolveApiPath('/api/passport', segment);
}

export function getTscPassportApiBase() {
  const base = resolveApiPath('/api/passport', '');
  return base.replace(/\/api\/passport$/, '') || '';
}

export async function fetchPublicPassport(slug) {
  return apiGet(passportPath(`/${slug}/public`));
}

export async function fetchPassportBySlug(slug) {
  return apiGet(passportPath(`/${slug}`));
}

export async function fetchPassportByArtistId(artistId) {
  return apiGet(resolveApiPath(`/api/artists/${encodeURIComponent(artistId)}/passport`));
}
