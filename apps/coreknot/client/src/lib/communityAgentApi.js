import { apiGet, apiPost, resolveApiPath } from './apiClient';

function communityAgentPath(segment = '') {
  return resolveApiPath('/api/agents/community', segment);
}

export const COMMUNITY_SUGGESTION_TYPE_LABELS = {
  suggest_event: 'Suggest event',
  create_poll: 'Create poll',
  recommend_member: 'Recommend member',
  re_engage_member: 'Re-engage',
};

export function communitySuggestionPriorityClass(priority) {
  if (priority === 'high') return 'text-red-600 dark:text-red-400';
  if (priority === 'medium') return 'text-amber-600 dark:text-amber-400';
  return 'text-[var(--color-text-muted)]';
}

export function formatCommunityConfidence(confidence) {
  if (confidence == null) return '—';
  const pct = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
  return `${pct}% confidence`;
}

export async function fetchCommunitySuggestions(communityId, limit = 20) {
  return apiGet(communityAgentPath(`/suggestions/${encodeURIComponent(communityId)}`), {
    params: { limit, status: 'active' },
  });
}

export async function runCommunityAgent(communityId, limit = 8) {
  return apiPost(communityAgentPath(`/run/${encodeURIComponent(communityId)}`), { limit });
}

export async function approveCommunitySuggestion(suggestionId) {
  return apiPost(communityAgentPath(`/suggestions/${encodeURIComponent(suggestionId)}/approve`));
}

export async function dismissCommunitySuggestion(suggestionId) {
  return apiPost(communityAgentPath(`/suggestions/${encodeURIComponent(suggestionId)}/dismiss`));
}
