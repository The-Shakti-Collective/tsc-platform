/** Phase 8 Step 4 — Rewards catalog + redemption helpers. */

export const REWARD_CATEGORIES = [
  'merch',
  'tickets',
  'meet_greet',
  'community_access',
  'priority_application',
] as const;

export type RewardCategoryValue = (typeof REWARD_CATEGORIES)[number];

export const REWARD_REDEMPTION_STATUSES = [
  'pending',
  'fulfilled',
  'cancelled',
] as const;

export type RewardRedemptionStatusValue =
  (typeof REWARD_REDEMPTION_STATUSES)[number];

export const REWARD_MODELS = ['Reward', 'RewardRedemption'] as const;

export type RewardModel = (typeof REWARD_MODELS)[number];

export const DEFAULT_REWARD_CATALOG = [
  {
    id: 'reward-tsc-tee',
    slug: 'tsc-underground-tee',
    name: 'TSC Underground Tee',
    description: 'Limited edition TSC Underground merch — unisex fit, ships within India.',
    creditCost: 120,
    category: 'merch' as RewardCategoryValue,
    stock: 50,
    metadata: { size: 'M/L/XL', color: 'black' },
  },
  {
    id: 'reward-ritviz-ticket',
    slug: 'ritviz-live-mumbai',
    name: 'Ritviz Live — Mumbai GA',
    description: 'General admission ticket for Ritviz Live at Mumbai (date TBA).',
    creditCost: 250,
    category: 'tickets' as RewardCategoryValue,
    stock: 20,
    metadata: { city: 'Mumbai', artistId: 'art-ritviz' },
  },
  {
    id: 'reward-prabh-meet',
    slug: 'prabh-deep-meet-greet',
    name: 'Prabh Deep Meet & Greet',
    description: 'Exclusive 15-min meet & greet slot at next TSC Underground showcase.',
    creditCost: 400,
    category: 'meet_greet' as RewardCategoryValue,
    stock: 5,
    metadata: { artistId: 'art-prabh-deep', durationMinutes: 15 },
  },
  {
    id: 'reward-discord-access',
    slug: 'tsc-private-discord',
    name: 'TSC Private Discord Access',
    description: '30-day access to TSC Underground private Discord channels.',
    creditCost: 80,
    category: 'community_access' as RewardCategoryValue,
    stock: null,
    metadata: { communityId: 'com-tsc-underground', durationDays: 30 },
  },
  {
    id: 'reward-collab-priority',
    slug: 'collab-priority-pass',
    name: 'Collab Priority Application Pass',
    description: 'Priority review on your next collaboration marketplace application.',
    creditCost: 150,
    category: 'priority_application' as RewardCategoryValue,
    stock: null,
    metadata: { validDays: 90 },
  },
] as const;

export function normalizeRewardCategory(
  category?: string | null,
): RewardCategoryValue {
  if (category && (REWARD_CATEGORIES as readonly string[]).includes(category)) {
    return category as RewardCategoryValue;
  }
  return 'merch';
}

export function normalizeRedemptionStatus(
  status?: string | null,
): RewardRedemptionStatusValue {
  if (
    status &&
    (REWARD_REDEMPTION_STATUSES as readonly string[]).includes(status)
  ) {
    return status as RewardRedemptionStatusValue;
  }
  return 'pending';
}
