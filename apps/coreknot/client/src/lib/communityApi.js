import { apiGet, apiPost, apiPatch, apiDelete, resolveApiPath } from './apiClient';

export const TSC_UNDERGROUND_ID = 'com-tsc-underground';

function communityPath(communityId, segment = '') {
  return resolveApiPath(`/api/communities/${communityId}`, segment);
}

export function getTscCommunityApiBase() {
  return resolveApiPath('/api/communities', '').replace(/\/api\/communities$/, '') || '';
}

export async function fetchCommunityDashboard(communityId = TSC_UNDERGROUND_ID) {
  return apiGet(communityPath(communityId, '/dashboard'));
}

export async function fetchCommunityMembers(communityId = TSC_UNDERGROUND_ID, page = 1) {
  return apiGet(communityPath(communityId, '/members'), { params: { page } });
}

export async function fetchCommunityEvents(communityId = TSC_UNDERGROUND_ID) {
  return apiGet(communityPath(communityId, '/events'));
}

export async function addCommunityMember(communityId, payload) {
  return apiPost(communityPath(communityId, '/members'), payload);
}

export async function createCommunityOpportunity(communityId, payload) {
  return apiPost(communityPath(communityId, '/opportunities'), payload);
}

export async function updateCommunitySettings(communityId, payload) {
  return apiPatch(communityPath(communityId, '/settings'), payload);
}

export async function joinCommunity(communityId) {
  return apiPost(communityPath(communityId, '/join'), {});
}

export async function leaveCommunity(communityId) {
  return apiPost(communityPath(communityId, '/leave'), {});
}

export async function fetchMyCommunityMembership(communityId) {
  return apiGet(communityPath(communityId, '/membership/me'));
}

export async function updateCommunityMemberRole(communityId, personId, payload) {
  return apiPatch(communityPath(communityId, `/members/${personId}`), payload);
}
