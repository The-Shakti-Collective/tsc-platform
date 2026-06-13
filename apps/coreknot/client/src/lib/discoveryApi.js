import { apiGet, resolveApiPath } from './apiClient';

function discoveryPath(segment = '') {
  return resolveApiPath('/api/discovery', segment);
}

export function fetchDiscoveryPeople(params = {}) {
  return apiGet(discoveryPath('/people'), { params });
}

export function fetchDiscoveryCommunities(params = {}) {
  return apiGet(discoveryPath('/communities'), { params });
}

export function fetchDiscoveryEvents(params = {}) {
  return apiGet(discoveryPath('/events'), { params });
}

export function fetchDiscoveryCollaborations(params = {}) {
  return apiGet(discoveryPath('/collaborations'), { params });
}
