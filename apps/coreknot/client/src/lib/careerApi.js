import { apiGet, apiPost, resolveApiPath } from './apiClient';

function careerPath(segment = '') {
  return resolveApiPath('/api/agents/career', segment);
}

export const CAREER_ACTION_TYPE_LABELS = {
  apply_opportunity: 'Apply to opportunity',
  release_content: 'Release content',
  collaborate: 'Collaborate',
  tour: 'Tour planning',
  brand_outreach: 'Brand outreach',
};

export function careerActionPriorityClass(priority) {
  if (priority === 'high') return 'text-red-500';
  if (priority === 'medium') return 'text-amber-500';
  return 'text-[var(--color-text-muted)]';
}

export function formatCareerConfidence(confidence) {
  if (confidence == null) return '—';
  return `${Math.round(confidence * 100)}%`;
}

export async function fetchCareerDashboard(artistId) {
  return apiGet(careerPath(`/dashboard/${encodeURIComponent(artistId)}`));
}

export async function fetchCareerActions(artistId, limit = 20) {
  return apiGet(careerPath(`/actions/${encodeURIComponent(artistId)}`), { params: { limit } });
}

export async function runCareerAgent(artistId, limit = 8) {
  return apiPost(careerPath(`/run/${encodeURIComponent(artistId)}`), { limit });
}

export async function dismissCareerAction(actionId) {
  return apiPost(careerPath(`/actions/${encodeURIComponent(actionId)}/dismiss`));
}
