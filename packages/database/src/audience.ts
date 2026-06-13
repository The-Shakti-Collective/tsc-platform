/** Phase 8 Step 5 — Audience Intelligence V2 rule-based aggregates (no ML). */

import { clampFanScore } from './fan.js';

export const AUDIENCE_SNAPSHOT_MODELS = [
  'AudienceHealthSnapshot',
  'CommunityAudienceSnapshot',
] as const;

export type AudienceSnapshotModel = (typeof AUDIENCE_SNAPSHOT_MODELS)[number];

export const AUDIENCE_PERIOD_DAYS = 30;

export interface ArtistAudienceFactorInput {
  totalFollowers: number;
  newFollowersCurrent: number;
  newFollowersPrevious: number;
  activeFollowerCount: number;
  eventRegistered: number;
  eventCheckedIn: number;
  avgSpendScore: number;
  avgSuperfanScore: number;
  platinumPlusCount: number;
  membershipRevenueStub: number;
  fanIntelligenceAvgLoyalty: number | null;
}

export interface CommunityAudienceFactorInput {
  totalMembers: number;
  newMembersCurrent: number;
  newMembersPrevious: number;
  activeMemberCount: number;
  membershipRevenueStub: number;
  newSuperfans: number;
  eventRegistered: number;
  eventCheckedIn: number;
}

export interface AudienceHealthMetrics {
  audienceGrowth: number;
  audienceChurn: number;
  fanRetention: number;
  fanConversion: number;
  lifetimeValueStub: number;
  metrics: Record<string, unknown>;
}

export interface CommunityAudienceMetrics {
  memberGrowth: number;
  activeMembers: number;
  membershipRevenueStub: number;
  fanGrowth: number;
  eventConversion: number;
  metrics: Record<string, unknown>;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function growthPercent(current: number, previous: number): number {
  if (previous > 0) return round2(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
}

export function computeAudienceHealth(input: ArtistAudienceFactorInput): AudienceHealthMetrics {
  const audienceGrowth = growthPercent(input.newFollowersCurrent, input.newFollowersPrevious);
  const retentionBase =
    input.totalFollowers > 0
      ? round2((input.activeFollowerCount / input.totalFollowers) * 100)
      : 0;
  const fanRetention = clampFanScore(
    retentionBase * 0.6 +
      (input.fanIntelligenceAvgLoyalty ?? input.avgSuperfanScore) * 0.4,
  );
  const audienceChurn = clampFanScore(Math.max(0, 100 - fanRetention - audienceGrowth * 0.1));
  const fanConversion =
    input.eventRegistered > 0
      ? round2((input.eventCheckedIn / input.eventRegistered) * 100)
      : input.platinumPlusCount > 0 && input.totalFollowers > 0
        ? round2((input.platinumPlusCount / input.totalFollowers) * 100)
        : 0;
  const lifetimeValueStub = round2(
    input.avgSpendScore * 12 +
      input.membershipRevenueStub * 0.05 +
      input.avgSuperfanScore * 2,
  );

  return {
    audienceGrowth,
    audienceChurn,
    fanRetention,
    fanConversion,
    lifetimeValueStub,
    metrics: {
      totalFollowers: input.totalFollowers,
      newFollowersCurrent: input.newFollowersCurrent,
      newFollowersPrevious: input.newFollowersPrevious,
      activeFollowerCount: input.activeFollowerCount,
      eventRegistered: input.eventRegistered,
      eventCheckedIn: input.eventCheckedIn,
      avgSpendScore: round2(input.avgSpendScore),
      avgSuperfanScore: round2(input.avgSuperfanScore),
      platinumPlusCount: input.platinumPlusCount,
      membershipRevenueStub: round2(input.membershipRevenueStub),
      fanIntelligenceAvgLoyalty: input.fanIntelligenceAvgLoyalty,
      periodDays: AUDIENCE_PERIOD_DAYS,
    },
  };
}

export function computeCommunityAudience(
  input: CommunityAudienceFactorInput,
): CommunityAudienceMetrics {
  const memberGrowth = growthPercent(input.newMembersCurrent, input.newMembersPrevious);
  const fanGrowth =
    input.totalMembers > 0
      ? round2((input.newSuperfans / input.totalMembers) * 100)
      : input.newSuperfans > 0
        ? 100
        : 0;
  const eventConversion =
    input.eventRegistered > 0
      ? round2((input.eventCheckedIn / input.eventRegistered) * 100)
      : 0;

  return {
    memberGrowth,
    activeMembers: input.activeMemberCount,
    membershipRevenueStub: round2(input.membershipRevenueStub),
    fanGrowth,
    eventConversion,
    metrics: {
      totalMembers: input.totalMembers,
      newMembersCurrent: input.newMembersCurrent,
      newMembersPrevious: input.newMembersPrevious,
      newSuperfans: input.newSuperfans,
      eventRegistered: input.eventRegistered,
      eventCheckedIn: input.eventCheckedIn,
      periodDays: AUDIENCE_PERIOD_DAYS,
    },
  };
}

/** Churn-risk threshold — fanRetention below this flags at-risk artist stub. */
export const CHURN_RISK_RETENTION_THRESHOLD = 45;

/** High-growth threshold for top-growth artists insight. */
export const HIGH_GROWTH_AUDIENCE_THRESHOLD = 12;
