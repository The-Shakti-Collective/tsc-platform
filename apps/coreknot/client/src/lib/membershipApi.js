import { apiGet, apiPost, resolveApiPath } from './apiClient';

export const TSC_UNDERGROUND_PLUS_ID = 'mem-tsc-underground-plus';

function membershipPath(segment = '') {
  return resolveApiPath('/api/memberships', segment);
}

export async function fetchCommunityMemberships(communityId) {
  return apiGet(resolveApiPath(`/api/communities/${communityId}/memberships`));
}

export async function fetchMyMemberships(params = {}) {
  return apiGet(membershipPath('/me'), { params });
}

export async function createCommunityMembership(communityId, body) {
  return apiPost(resolveApiPath(`/api/communities/${communityId}/memberships`), body);
}

export async function fetchMembership(membershipId) {
  return apiGet(membershipPath(`/${membershipId}`));
}

export async function subscribeMembership(membershipId) {
  return apiPost(membershipPath(`/${membershipId}/subscribe`));
}

export async function cancelMembership(membershipId) {
  return apiPost(membershipPath(`/${membershipId}/cancel`));
}

export const BENEFIT_LABELS = {
  early_access: 'Early access',
  private_events: 'Private events',
  meetups: 'Meetups',
  discounts: 'Discounts',
  exclusive_content: 'Exclusive content',
};

export function formatMembershipPrice(price, currency = 'INR') {
  if (!price) return 'Free (track-only)';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}
