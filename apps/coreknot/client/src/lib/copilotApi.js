import { apiGet, apiPost, resolveApiPath } from './apiClient';

function copilotPath(segment = '') {
  return resolveApiPath('/api/agents/copilot', segment);
}

export const COPILOT_STARTER_PROMPTS = [
  'Show artists at risk',
  'Which communities are growing fastest?',
  'What opportunities should I apply to?',
  'Who should I collaborate with?',
  'What is the revenue forecast?',
];

export async function fetchCopilotSuggestions() {
  return apiGet(copilotPath('/suggestions'));
}

export async function submitCopilotQuery(payload = {}) {
  return apiPost(copilotPath('/query'), payload);
}

export async function submitCopilotFeedback(payload) {
  return apiPost(copilotPath('/feedback'), payload);
}
