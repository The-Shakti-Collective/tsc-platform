import { apiGet, apiPost, resolveApiPath } from './apiClient';

function automationPath(segment = '') {
  return resolveApiPath('/api/agents/automation-v2', segment);
}

export const AUTOMATION_TRIGGER_LABELS = {
  artist_health_drop: 'Artist health drop',
  community_churn_spike: 'Community churn spike',
  deal_stalled: 'Deal stalled',
  superfan_milestone: 'Superfan milestone',
  opportunity_deadline: 'Opportunity deadline',
};

export async function fetchAutomationRules(params = {}) {
  return apiGet(automationPath('/rules'), { params });
}

export async function fetchRecentAutomationRuns(limit = 10) {
  return apiGet(automationPath('/runs/recent'), { params: { limit } });
}

export async function evaluateAutomationAll(payload = {}) {
  return apiPost(automationPath('/evaluate'), payload);
}

export async function runAutomationRule(ruleId, payload = {}) {
  return apiPost(automationPath(`/rules/${encodeURIComponent(ruleId)}/run`), payload);
}
