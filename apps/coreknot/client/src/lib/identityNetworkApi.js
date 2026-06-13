import { apiGet, apiPost, resolveApiPath } from './apiClient';

function identityPath(segment = '') {
  return resolveApiPath('/api/tsc-identity', segment);
}

export function getTscIdentityApiBase() {
  const base = resolveApiPath('/api/tsc-identity', '');
  return base.replace(/\/api\/tsc-identity$/, '') || '';
}

export async function fetchPublicTscIdentity(namespace, slug) {
  return apiGet(identityPath(`/${namespace}/${slug}/public`));
}

export async function fetchVerificationBadges(entityType, entityId) {
  return apiGet(identityPath(`/${entityType}/${entityId}/badges`));
}

export async function fetchPersonIdentityNetwork(personId) {
  return apiGet(identityPath(`/person/${personId}/network`));
}

export async function adminSetIdentityBadge(entityType, entityId, badge) {
  return apiPost(identityPath(`/admin/${entityType}/${entityId}/badges`), badge);
}

export function routePathForNamespace(namespace, slug) {
  const prefix = namespace === 'artist' ? 'a' : namespace.charAt(0);
  return `/${prefix}/${slug}`;
}

export function copyTscIdentityUrl(canonicalUrl) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(canonicalUrl);
  }
  return Promise.reject(new Error('Clipboard unavailable'));
}
