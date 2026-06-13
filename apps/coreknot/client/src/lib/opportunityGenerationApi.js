import { apiGet, apiPost, resolveApiPath } from './apiClient';

function generationPath(segment = '') {
  return resolveApiPath('/api/agents/opportunity-generation', segment);
}

export const SUGGESTED_TYPE_LABELS = {
  showcase_event: 'Showcase event',
  collaboration_open_call: 'Collaboration open call',
  grant_opportunity: 'Grant opportunity',
};

export async function runOpportunityGeneration(payload = {}) {
  return apiPost(generationPath('/run'), { scope: { cityLimit: 10, limit: 20 }, ...payload });
}

export async function fetchOpportunityGenerationDrafts(params = {}) {
  return apiGet(generationPath('/drafts'), {
    params: { status: 'pending_approval', limit: 30, ...params },
  });
}

export async function fetchOpportunityGenerationSignals(limit = 15) {
  return apiGet(generationPath('/signals'), { params: { limit } });
}

export async function approveOpportunityGenerationDraft(id, payload = {}) {
  return apiPost(generationPath(`/drafts/${encodeURIComponent(id)}/approve`), {
    requireDecision: false,
    deadlineDays: 45,
    ...payload,
  });
}

export async function dismissOpportunityGenerationDraft(id) {
  return apiPost(generationPath(`/drafts/${encodeURIComponent(id)}/dismiss`), {});
}
