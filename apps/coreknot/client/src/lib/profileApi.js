import { apiGet, apiPost, apiDelete, resolveApiPath } from './apiClient';

function profilePath(segment = '') {
  return resolveApiPath('/api/profile', segment);
}

export function getTscProfileApiBase() {
  const base = resolveApiPath('/api/profile', '');
  return base.replace(/\/api\/profile$/, '') || '';
}

export async function fetchEcosystemPassport(slug) {
  return apiGet(profilePath(`/${slug}/ecosystem`));
}

export async function fetchPublicProfile(slug) {
  return apiGet(profilePath(`/${slug}/public`));
}

export async function fetchMyProfile() {
  return apiGet(profilePath('/me'));
}

export async function fetchVerification(personId) {
  return apiGet(profilePath(`/${encodeURIComponent(personId)}/verification`));
}

export async function followPerson(personId) {
  return apiPost(profilePath(`/follow/${encodeURIComponent(personId)}`));
}

export async function unfollowPerson(personId) {
  return apiDelete(profilePath(`/unfollow/${encodeURIComponent(personId)}`));
}

export async function fetchFollowStatus(personId) {
  return apiGet(profilePath(`/${encodeURIComponent(personId)}/follow-status`));
}

export async function fetchFollowers(personId, page = 1) {
  return apiGet(profilePath(`/${encodeURIComponent(personId)}/followers`), { params: { page } });
}

export async function fetchFollowing(personId, page = 1) {
  return apiGet(profilePath(`/${encodeURIComponent(personId)}/following`), { params: { page } });
}
