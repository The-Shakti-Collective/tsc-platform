import { apiGet, apiPost, resolveApiPath } from './apiClient';

function rewardsPath(segment = '') {
  return resolveApiPath('/api/rewards', segment);
}

export const CATEGORY_LABELS = {
  merch: 'Merch',
  tickets: 'Tickets',
  meet_greet: 'Meet & Greet',
  community_access: 'Community Access',
  priority_application: 'Priority Application',
};

export const STATUS_LABELS = {
  pending: 'Pending fulfillment',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export async function fetchRewardCatalog(params = {}) {
  return apiGet(rewardsPath(''), { params });
}

export async function fetchMyRedemptions(params = {}) {
  return apiGet(rewardsPath('/me/redemptions'), { params });
}

export async function fetchMyCreditBalance() {
  return apiGet(resolveApiPath('/api/credits/me'));
}

export async function redeemReward(rewardId) {
  return apiPost(rewardsPath(`/${rewardId}/redeem`));
}

export async function shareContentStub() {
  return apiPost(resolveApiPath('/api/credits/stub/share'));
}

export async function referMemberStub(referredPersonId) {
  return apiPost(resolveApiPath('/api/credits/stub/refer'), { referredPersonId });
}

export function formatCreditCost(amount) {
  return `${amount} credits`;
}
