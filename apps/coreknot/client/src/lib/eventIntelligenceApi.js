import { apiGet, apiPost, resolveApiPath } from './apiClient';

function eventIntelPath(segment = '') {
  return resolveApiPath('/api/event-intelligence', segment);
}

export function getTscEventIntelligenceApiBase() {
  const base = resolveApiPath('/api/event-intelligence', '');
  return base.replace(/\/api\/event-intelligence$/, '') || '';
}

export async function fetchEventIntelligence(eventId) {
  return apiGet(eventIntelPath(`/${encodeURIComponent(eventId)}/intelligence`));
}

export async function fetchEventIntelligencePredict(eventId) {
  return apiGet(eventIntelPath(`/${encodeURIComponent(eventId)}/intelligence/predict`));
}

export async function refreshEventIntelligence(eventId) {
  return apiPost(eventIntelPath(`/${encodeURIComponent(eventId)}/intelligence/refresh`));
}

export async function fetchEventIntelligenceRecommendations(eventId) {
  return apiGet(eventIntelPath(`/${encodeURIComponent(eventId)}/intelligence/recommendations`));
}

export async function fetchCityFanDensityInsights(limit = 10) {
  return apiGet(eventIntelPath('/insights/city-fan-density'), { params: { limit } });
}

export async function fetchConversionLeaders(limit = 10) {
  return apiGet(eventIntelPath('/insights/conversion-leaders'), { params: { limit } });
}

export async function fetchRepeatAttendanceInsights(limit = 10) {
  return apiGet(eventIntelPath('/insights/repeat-attendance'), { params: { limit } });
}

export function formatInr(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value) {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}
