import { apiGet, apiPost, resolveApiPath } from './apiClient';

function talentDiscoveryPath(segment = '') {
  return resolveApiPath('/api/agents/talent-discovery', segment);
}

export const ENTITY_TYPE_LABELS = {
  Artist: 'Artist',
  Community: 'Community',
  City: 'City scene',
};

export async function runTalentDiscoveryScan(payload = {}) {
  return apiPost(talentDiscoveryPath('/run'), { limit: 20, cityLimit: 10, ...payload });
}

export async function fetchTalentDiscoveryAlerts(params = {}) {
  return apiGet(talentDiscoveryPath('/alerts'), {
    params: { limit: 30, status: 'active', ...params },
  });
}

export async function acknowledgeTalentDiscoveryAlert(alertId) {
  return apiPost(talentDiscoveryPath(`/alerts/${encodeURIComponent(alertId)}/acknowledge`));
}

export async function fetchFastGrowingArtists(limit = 20) {
  return apiGet(talentDiscoveryPath('/fast-growing-artists'), { params: { limit } });
}

export async function fetchEmergingCities(limit = 10) {
  return apiGet(talentDiscoveryPath('/emerging-cities'), { params: { limit } });
}
