import { apiGet, apiPost, resolveApiPath } from './apiClient';

export const DEFAULT_EVENT_ID = 'evt-nh7';

function eventAgentPath(segment = '') {
  return resolveApiPath('/api/agents/events', segment);
}

export const EVENT_SUGGESTION_TYPE_LABELS = {
  lineup: 'Lineup',
  marketing: 'Marketing',
  logistics: 'Logistics',
  revenue: 'Revenue',
};

export const EVENT_PHASE_LABELS = {
  planning: 'Planning',
  promotion: 'Promotion',
  live: 'Live',
  post_event: 'Post-event',
};

export function eventSuggestionPriorityClass(priority) {
  if (priority === 'high') return 'text-red-500';
  if (priority === 'medium') return 'text-amber-500';
  return 'text-[var(--color-text-muted)]';
}

export function formatEventConfidence(confidence) {
  if (confidence == null) return '—';
  return `${Math.round(confidence * 100)}%`;
}

export async function fetchEventAgentInsights(eventId, limit = 20) {
  return apiGet(eventAgentPath(`/${encodeURIComponent(eventId)}/insights`), { params: { limit } });
}

export async function runEventAgent(eventId, limit = 6) {
  return apiPost(eventAgentPath(`/${encodeURIComponent(eventId)}/run`), { limit });
}

export async function approveEventSuggestion(suggestionId) {
  return apiPost(eventAgentPath(`/suggestions/${encodeURIComponent(suggestionId)}/approve`));
}

export async function dismissEventSuggestion(suggestionId) {
  return apiPost(eventAgentPath(`/suggestions/${encodeURIComponent(suggestionId)}/dismiss`));
}
