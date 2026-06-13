import { clampScore } from "../utils.js";
import {
  PHASE5_SCORE_VERSION,
  type CommunityIntelligenceInput,
  type CommunityIntelligenceResult,
} from "./types.js";

function growthRate(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return clampScore(((current - previous) / previous) * 100);
}

function retentionRate(activeNow: number, activeBefore: number, memberCount: number): number {
  if (memberCount <= 0) return 0;
  const retained = Math.min(activeNow, activeBefore);
  return clampScore((retained / memberCount) * 100);
}

function churnRate(churned: number, memberCount: number): number {
  if (memberCount <= 0) return 0;
  return clampScore((churned / memberCount) * 100);
}

function detectReEngagementSignals(input: CommunityIntelligenceInput, churn: number): string[] {
  const signals: string[] = [];

  if (churn >= 15) {
    signals.push("high_churn_campaign");
  }

  if ((input.dormantMemberCount ?? 0) >= 10) {
    signals.push("dormant_winback");
  }

  if ((input.postsLast30 ?? 0) < 5 && (input.memberCount ?? 0) > 50) {
    signals.push("content_revival");
  }

  if ((input.newMembersLast30 ?? 0) > 0 && (input.activeMembersLast30 ?? 0) < (input.newMembersLast30 ?? 0)) {
    signals.push("onboarding_nudge");
  }

  if ((input.superFanCount ?? 0) >= 5) {
    signals.push("superfan_ambassador");
  }

  return signals;
}

/**
 * Community growth, retention, churn, and re-engagement signals.
 * Maps to `CommunityIntelligenceSnapshot` rows.
 */
export function calculateCommunityIntelligence(
  input: CommunityIntelligenceInput,
): CommunityIntelligenceResult {
  const memberCount = input.memberCount ?? 0;
  const previousMembers = input.memberCountPrevious30 ?? memberCount;

  const growth = growthRate(memberCount, previousMembers);
  const retention = retentionRate(
    input.activeMembersLast30 ?? 0,
    input.activeMembersPrevious30 ?? 0,
    memberCount,
  );
  const churn = churnRate(input.churnedMembersLast30 ?? 0, memberCount);

  const superFanCount = input.superFanCount ?? 0;
  const dormantCount = input.dormantMemberCount ?? 0;
  const reEngagementSignals = detectReEngagementSignals(input, churn);

  return {
    communityId: input.communityId,
    growth,
    retention,
    churn,
    superFanCount,
    dormantCount,
    reEngagementSignals,
    metrics: {
      memberCount,
      newMembersLast30: input.newMembersLast30 ?? 0,
      activeMembersLast30: input.activeMembersLast30 ?? 0,
      postsLast30: input.postsLast30 ?? 0,
    },
    calculatedAt: new Date().toISOString(),
    version: PHASE5_SCORE_VERSION,
  };
}
