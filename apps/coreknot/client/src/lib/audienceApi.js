import { apiGet, apiPost, resolveApiPath } from './apiClient';

function audiencePath(segment = '') {
  return resolveApiPath('/api/audience', segment);
}

export async function fetchArtistAudienceHealth(artistId) {
  return apiGet(audiencePath(`/artists/${artistId}/health`));
}

export async function refreshArtistAudienceHealth(artistId) {
  return apiPost(audiencePath(`/refresh/artist/${artistId}`));
}

export async function fetchCommunityAudience(communityId) {
  return apiGet(audiencePath(`/communities/${communityId}`));
}

export async function refreshCommunityAudience(communityId) {
  return apiPost(audiencePath(`/refresh/community/${communityId}`));
}

export async function fetchTopGrowthArtists(limit = 10) {
  return apiGet(audiencePath('/insights/top-growth-artists'), { params: { limit } });
}

export async function fetchChurnRiskArtists(limit = 10) {
  return apiGet(audiencePath('/insights/churn-risk'), { params: { limit } });
}
