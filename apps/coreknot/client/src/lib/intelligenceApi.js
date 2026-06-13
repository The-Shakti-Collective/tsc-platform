import { apiGet, apiPost, resolveApiPath } from './apiClient';

function intelligencePath(segment = '') {
  return resolveApiPath('/api/intelligence', segment);
}

function agentsInsightPath(insightId, actionType) {
  return resolveApiPath(
    '/api/agents/insights',
    `/${encodeURIComponent(insightId)}/actions/${encodeURIComponent(actionType)}`,
  );
}

async function postIntelligence(path, body = {}) {
  return apiPost(intelligencePath(path), body);
}

export function getTscIntelligenceApiBase() {
  const base = resolveApiPath('/api/intelligence', '');
  return base.replace(/\/api\/intelligence$/, '') || '';
}

export async function fetchCommandCenter(period = 'weekly') {
  return apiGet(intelligencePath('/command-center'), { params: { period } });
}

export async function fetchArtistHealth(artistId) {
  return apiGet(intelligencePath(`/artists/${encodeURIComponent(artistId)}/health`));
}

export async function fetchOpportunityIntelligence() {
  return apiGet(intelligencePath('/opportunities/scores'));
}

export async function fetchEcosystemGraph(artistId) {
  if (!artistId) throw new Error('artistId required');
  return apiGet(intelligencePath(`/ecosystem/Artist/${encodeURIComponent(artistId)}/graph`));
}

export async function postCreateCampaign(payload = {}) {
  return postIntelligence('/actions/create-campaign', { section: 'cities', ...payload });
}

export async function postInviteArtists(payload = {}) {
  return postIntelligence('/actions/invite-artists', { section: 'artists-at-risk', ...payload });
}

export async function postLaunchOpportunity(payload = {}) {
  return postIntelligence('/actions/launch-opportunity', { section: 'opportunities', ...payload });
}

export async function postContactCommunity(payload = {}) {
  return postIntelligence('/actions/contact-community', { section: 'communities', ...payload });
}

export async function postReviewPipelineDeals(payload = {}) {
  return postIntelligence('/actions/review-pipeline-deals', { section: 'deals', ...payload });
}

export async function postLaunchBrandCampaign(payload = {}) {
  return postIntelligence('/actions/launch-brand-campaign', { section: 'brands', ...payload });
}

export async function postContactAtRiskArtists(payload = {}) {
  return postIntelligence('/actions/review-recovery-plan', {
    section: 'artists-at-risk',
    ...payload,
  });
}

export async function postReviewRecoveryPlan(payload = {}) {
  return postIntelligence('/actions/review-recovery-plan', payload);
}

export async function postApplyRecommended(payload = {}) {
  return postIntelligence('/actions/apply-recommended', { section: 'opportunities', ...payload });
}

export async function postLaunchCommunityCampaign(payload = {}) {
  return postIntelligence('/actions/launch-community-campaign', { section: 'communities', ...payload });
}

export async function postExecuteInsightAction(insightId, actionType) {
  return apiPost(agentsInsightPath(insightId, actionType), {});
}
