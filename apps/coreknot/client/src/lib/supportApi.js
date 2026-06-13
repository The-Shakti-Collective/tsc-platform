import { apiGet, apiPost, resolveApiPath } from './apiClient';

function supportPath(segment = '') {
  return resolveApiPath('/api/support', segment);
}

const SUPPORT_ACTION_LABELS = {
  tip: 'Tip',
  donation: 'Donation',
  membership: 'Membership',
  merch: 'Merch',
};

export function formatSupportAction(actionType) {
  return SUPPORT_ACTION_LABELS[actionType] ?? actionType;
}

export async function recordArtistSupport(artistId, payload = {}) {
  return apiPost(supportPath(`/artists/${artistId}`), payload);
}

export async function recordCommunitySupport(communityId, payload = {}) {
  return apiPost(supportPath(`/communities/${communityId}`), payload);
}

export async function recordEventSupport(eventId, payload = {}) {
  return apiPost(supportPath(`/events/${eventId}`), payload);
}

export async function fetchMySupportHistory(limit = 50) {
  return apiGet(supportPath('/me/history'), { params: { limit } });
}

export async function fetchArtistSupporters(artistId, limit = 20, sortBy = 'amount') {
  return apiGet(supportPath(`/artists/${artistId}/supporters`), { params: { limit, sortBy } });
}

export async function fetchCommunitySupporters(communityId, limit = 20, sortBy = 'amount') {
  return apiGet(supportPath(`/communities/${communityId}/supporters`), { params: { limit, sortBy } });
}

export async function fetchEventSupporters(eventId, limit = 20, sortBy = 'amount') {
  return apiGet(supportPath(`/events/${eventId}/supporters`), { params: { limit, sortBy } });
}
