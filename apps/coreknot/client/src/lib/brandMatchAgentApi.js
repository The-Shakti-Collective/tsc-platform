import { apiGet, apiPost, resolveApiPath } from './apiClient';

export const DEFAULT_BRAND_ID = 'brand-redbull-in';

function brandMatchAgentPath(segment = '') {
  return resolveApiPath('/api/agents/brand-match', segment);
}

export function formatBrandMatchConfidence(confidence) {
  if (confidence == null) return '—';
  const pct = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
  return `${pct}%`;
}

export function confidenceBarWidth(confidence) {
  if (confidence == null) return 0;
  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
}

export async function fetchBrandMatchResults(brandId, limit = 20) {
  return apiGet(brandMatchAgentPath(`/results/${encodeURIComponent(brandId)}`), {
    params: { limit, status: 'active' },
  });
}

export async function runBrandMatchAgent(payload) {
  return apiPost(brandMatchAgentPath('/run'), payload);
}

export async function inviteBrandMatchArtist(recommendationId) {
  return apiPost(brandMatchAgentPath(`/results/${encodeURIComponent(recommendationId)}/invite`), {});
}

export async function fetchBrandMatchCampaignHistory(brandId) {
  return apiGet(brandMatchAgentPath(`/campaigns/${encodeURIComponent(brandId)}`));
}
