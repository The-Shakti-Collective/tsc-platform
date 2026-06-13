import { apiGet, resolveApiPath } from './apiClient';

export const RITVIZ_ARTIST_ID = 'art-ritviz';

function audienceOsPath(segment = '') {
  return resolveApiPath('/api/audience-os', segment);
}

export async function fetchArtistAudienceOsDashboard(artistId, limit = 10) {
  return apiGet(audienceOsPath(`/artists/${artistId}/dashboard`), { params: { limit } });
}

export async function fetchCommunityAudienceOsDashboard(communityId, limit = 10) {
  return apiGet(audienceOsPath(`/communities/${communityId}/dashboard`), { params: { limit } });
}

export async function exportArtistAudienceOs(artistId) {
  return apiGet(audienceOsPath(`/artists/${artistId}/export`));
}

export function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function downloadJsonExport(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
