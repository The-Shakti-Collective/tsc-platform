/** Phase 8 Step 2 — Superfan Engine rule-based scoring (no ML). */

import { clampFanScore } from './fan.js';

export const SUPERFAN_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'legend'] as const;
export type SuperfanTier = (typeof SUPERFAN_TIERS)[number];

/** Minimum score (inclusive) for each tier — configurable service constants. */
export const SUPERFAN_TIER_THRESHOLDS: Record<SuperfanTier, number> = {
  bronze: 0,
  silver: 25,
  gold: 50,
  platinum: 75,
  legend: 90,
};

export const SUPERFAN_SCORE_WEIGHTS = {
  eventCheckedIn: 8,
  eventRegistered: 3,
  purchaseCount: 10,
  spendScorePoint: 0.3,
  communityActive: 6,
  referral: 12,
  membershipMonth: 2,
  membershipMonthCap: 24,
} as const;

export interface SuperfanFactorInput {
  checkedInCount: number;
  registeredCount: number;
  purchaseCount: number;
  spendScore: number;
  communityCount: number;
  referralCount: number;
  membershipMonths: number;
}

export interface SuperfanFactors {
  eventsAttended: number;
  purchases: number;
  community: number;
  referrals: number;
  membershipDuration: number;
  raw: SuperfanFactorInput;
}

export interface SuperfanCalculation {
  superfanScore: number;
  tier: SuperfanTier;
  factors: SuperfanFactors;
}

export function tierFromSuperfanScore(score: number): SuperfanTier {
  const clamped = clampFanScore(score);
  if (clamped >= SUPERFAN_TIER_THRESHOLDS.legend) return 'legend';
  if (clamped >= SUPERFAN_TIER_THRESHOLDS.platinum) return 'platinum';
  if (clamped >= SUPERFAN_TIER_THRESHOLDS.gold) return 'gold';
  if (clamped >= SUPERFAN_TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

export function calculateSuperfanScore(input: SuperfanFactorInput): SuperfanCalculation {
  const w = SUPERFAN_SCORE_WEIGHTS;

  const eventsAttended = clampFanScore(
    input.checkedInCount * w.eventCheckedIn + input.registeredCount * w.eventRegistered,
  );
  const purchases = clampFanScore(
    input.purchaseCount * w.purchaseCount + input.spendScore * w.spendScorePoint,
  );
  const community = clampFanScore(input.communityCount * w.communityActive);
  const referrals = clampFanScore(input.referralCount * w.referral);
  const membershipDuration = clampFanScore(
    Math.min(w.membershipMonthCap, input.membershipMonths * w.membershipMonth),
  );

  const superfanScore = clampFanScore(
    eventsAttended + purchases + community + referrals + membershipDuration,
  );

  return {
    superfanScore,
    tier: tierFromSuperfanScore(superfanScore),
    factors: {
      eventsAttended,
      purchases,
      community,
      referrals,
      membershipDuration,
      raw: input,
    },
  };
}

/** Months since earliest community join (membership duration stub). */
export function membershipMonthsFromJoinDate(earliestJoin: Date | null, asOf = new Date()): number {
  if (!earliestJoin) return 0;
  const ms = asOf.getTime() - earliestJoin.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
}

export const SUPERFAN_SNAPSHOT_MODELS = ['SuperfanSnapshot'] as const;

/** Read-helper aggregate shape for artist-scoped superfan rollups (Step 5). */
export interface SuperfanArtistAggregate {
  avgScore: number;
  platinumPlusCount: number;
  totalSnapshots: number;
  tierCounts: Record<SuperfanTier, number>;
}

export function aggregateSuperfanRows(
  rows: Array<{ superfanScore: number; tier: SuperfanTier | string }>,
): SuperfanArtistAggregate {
  const tierCounts = Object.fromEntries(
    SUPERFAN_TIERS.map((tier) => [tier, 0]),
  ) as Record<SuperfanTier, number>;

  let scoreSum = 0;
  let platinumPlusCount = 0;

  for (const row of rows) {
    scoreSum += row.superfanScore;
    const tier = row.tier as SuperfanTier;
    if (tierCounts[tier] !== undefined) tierCounts[tier] += 1;
    if (tier === 'platinum' || tier === 'legend') platinumPlusCount += 1;
  }

  return {
    avgScore: rows.length > 0 ? Math.round((scoreSum / rows.length) * 100) / 100 : 0,
    platinumPlusCount,
    totalSnapshots: rows.length,
    tierCounts,
  };
}
