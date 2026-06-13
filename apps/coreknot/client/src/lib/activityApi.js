import { apiGet, resolveApiPath } from './apiClient';

function activityPath(segment = '') {
  return resolveApiPath('/api/activity', segment);
}

export function getTscActivityApiBase() {
  const base = resolveApiPath('/api/activity', '');
  return base.replace(/\/api\/activity$/, '') || '';
}

export async function fetchActivityFeed(page = 1, limit = 20) {
  return apiGet(activityPath('/feed'), { params: { page, limit } });
}

export async function fetchPersonActivity(personId, page = 1, limit = 20) {
  return apiGet(activityPath(`/person/${encodeURIComponent(personId)}`), { params: { page, limit } });
}

export async function fetchCommunityActivity(communityId, page = 1, limit = 20) {
  return apiGet(activityPath(`/community/${encodeURIComponent(communityId)}`), {
    params: { page, limit },
  });
}

export async function fetchFollowingFeed(page = 1, limit = 20) {
  return apiGet(resolveApiPath('/api/profile/me/following/feed'), { params: { page, limit } });
}
