import { apiGet, apiPost, resolveApiPath } from './apiClient';

function agentsPath(segment = '') {
  return resolveApiPath('/api/agents', segment);
}

export function getTscAgentsApiBase() {
  const base = resolveApiPath('/api/agents', '');
  return base.replace(/\/api\/agents$/, '') || '';
}

export async function fetchWorkflowCatalog() {
  return apiGet(agentsPath('/workflows'));
}

export async function runWorkflow(body = {}) {
  return apiPost(agentsPath('/workflows/run'), body);
}

export async function fetchWorkflowRun(runId) {
  return apiGet(agentsPath(`/workflows/runs/${encodeURIComponent(runId)}`));
}

export async function approveWorkflowRun(runId, body = {}) {
  return apiPost(agentsPath(`/workflows/runs/${encodeURIComponent(runId)}/approve`), body);
}

export async function cancelWorkflowRun(runId) {
  return apiPost(agentsPath(`/workflows/runs/${encodeURIComponent(runId)}/cancel`));
}
