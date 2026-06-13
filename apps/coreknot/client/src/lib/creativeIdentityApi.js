import { apiGet, apiPatch, apiPost, apiDelete, resolveApiPath } from './apiClient';

function creativePath(segment = '') {
  return resolveApiPath('/api/creative-identity', segment);
}

export function getCreativeIdentityApiBase() {
  return resolveApiPath('/api/creative-identity', '').replace(/\/api\/creative-identity$/, '') || '';
}

export async function fetchPublicCreativeIdentity(slug) {
  return apiGet(creativePath(`/${slug}/public`));
}

export async function fetchCreativeIdentityRoles(slug) {
  return apiGet(creativePath(`/${slug}/roles`));
}

export async function fetchMyCreativeIdentity() {
  return apiGet(creativePath('/me'));
}

export async function patchMyCreativeIdentity(patch) {
  return apiPatch(creativePath('/me'), patch);
}

export async function addCreativeRoleAssignment(body) {
  return apiPost(creativePath('/me/roles'), body);
}

export async function removeCreativeRoleAssignment(roleId) {
  return apiDelete(creativePath(`/me/roles/${roleId}`));
}

export const CREATIVE_VERTICAL_OPTIONS = [
  'music',
  'film',
  'photography',
  'podcast',
  'comedy',
  'dance',
  'content',
];

export const CREATIVE_ROLE_TAG_OPTIONS = [
  'photographer',
  'videographer',
  'artist',
  'producer',
  'manager',
  'founder',
  'community_leader',
];
