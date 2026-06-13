import { apiGet, apiPost, resolveApiPath } from './apiClient';

function agentsPath(segment = '') {
  return resolveApiPath('/api/agents', segment);
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export { formatCurrency as formatAgentRecommendationCurrency };

export async function fetchAgentRecommendationsForMe(limit = 20) {
  return apiGet(agentsPath('/recommendations/for-me'), { params: { limit } });
}

export async function fetchAgentRecommendationsForArtist(artistId, limit = 20) {
  return apiGet(agentsPath(`/recommendations/artist/${encodeURIComponent(artistId)}`), {
    params: { limit },
  });
}

export async function fetchOpportunityAgentRecommendations(artistId, limit = 20) {
  return apiGet(agentsPath(`/opportunity/recommendations/${encodeURIComponent(artistId)}`), {
    params: { limit },
  });
}

export async function runOpportunityAgent(artistId, limit = 10) {
  return apiPost(agentsPath('/opportunity/run'), { artistId, limit });
}

export async function approveAgentDecision(decisionId) {
  return apiPost(agentsPath(`/decisions/${encodeURIComponent(decisionId)}/approve`));
}

export async function rejectAgentDecision(decisionId) {
  return apiPost(agentsPath(`/decisions/${encodeURIComponent(decisionId)}/reject`));
}
