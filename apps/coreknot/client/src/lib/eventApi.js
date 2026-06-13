import { apiGet, apiPost, apiPatch, resolveApiPath } from './apiClient';

function eventPath(segment = '') {
  return resolveApiPath('/api/events', segment);
}

export function getTscEventApiBase() {
  const base = resolveApiPath('/api/events', '');
  return base.replace(/\/api\/events$/, '') || '';
}

export async function fetchEventParticipants(eventId, page = 1) {
  return apiGet(eventPath(`/${eventId}/participants`), { params: { page } });
}

export async function registerForEvent(eventId, payload = {}) {
  return apiPost(eventPath(`/${eventId}/register`), payload);
}

export async function checkInToEvent(eventId, payload = {}) {
  return apiPost(eventPath(`/${eventId}/check-in`), payload);
}

export async function fetchMyEventParticipation(eventId) {
  return apiGet(eventPath(`/${eventId}/participation/me`));
}
