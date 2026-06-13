import { apiGet, apiPost, resolveApiPath } from './apiClient';

function forecastPath(segment = '') {
  return resolveApiPath('/api/agents/forecast', segment);
}

function insightsPath(segment = '') {
  return resolveApiPath('/api/agents/insights', segment);
}

export const FORECAST_METRIC_LABELS = {
  revenue: 'Revenue',
  attendance: 'Attendance',
  growth: 'Audience growth',
  demand: 'Marketplace demand',
  membership_churn: 'Membership churn',
};

export const INSIGHT_SEVERITY_STYLES = {
  info: {
    border: 'border-blue-500/30',
    bg: 'rgba(59, 130, 246, 0.08)',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'rgba(234, 179, 8, 0.08)',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  },
  critical: {
    border: 'border-red-500/30',
    bg: 'rgba(239, 68, 68, 0.08)',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-500/15 text-red-800 dark:text-red-300',
  },
};

export async function runForecastAgent(payload = {}) {
  return apiPost(forecastPath('/run'), { horizons: ['d30', 'd90'], ...payload });
}

export async function fetchPlatformForecastRollup() {
  return apiGet(forecastPath('/platform'));
}

export async function fetchEntityForecasts(entityType, entityId) {
  return apiGet(forecastPath(`/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`));
}

export async function fetchInsightsFeed(params = {}) {
  return apiGet(insightsPath(''), { params: { limit: 10, ...params } });
}

export async function executeInsightAction(insightId, actionType) {
  return apiPost(
    insightsPath(`/${encodeURIComponent(insightId)}/actions/${encodeURIComponent(actionType)}`),
  );
}
