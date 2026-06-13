import type { FanIntelligenceTier } from "@tsc/types";
import { calculateAttendanceScore } from "../attendance-score.js";
import { calculateEngagementScore } from "../engagement-score.js";
import { calculateLoyaltyScore } from "../loyalty-score.js";
import { calculateSpendingScore } from "../spending-score.js";
import { clampScore, normalizeToScore } from "../utils.js";
import type { FanIntelligenceInput, FanIntelligenceScores } from "./types.js";

const INFLUENCE_CAP_DEFAULT = 20;

const COMPOSITE_WEIGHTS = {
  engagement: 0.25,
  purchase: 0.2,
  attendance: 0.2,
  influence: 0.15,
  loyalty: 0.2,
} as const;

function classifyFanTier(compositeScore: number, engagementScore: number): FanIntelligenceTier {
  if (compositeScore >= 80 && engagementScore >= 60) return "super";
  if (compositeScore >= 55) return "active";
  if (compositeScore >= 25) return "casual";
  return "dormant";
}

/**
 * Five fan dimension scores + tier classification (super / active / casual / dormant).
 * Reuses Phase 2.5 audience calculators; maps to `FanIntelligenceSnapshot`.
 */
export function calculateFanIntelligence(input: FanIntelligenceInput = { personId: "" }): FanIntelligenceScores {
  const engagementScore = calculateEngagementScore(
    input.engagement as Parameters<typeof calculateEngagementScore>[0],
  );
  const purchaseScore = calculateSpendingScore(
    input.spending as Parameters<typeof calculateSpendingScore>[0],
  );
  const attendanceScore = calculateAttendanceScore(
    input.attendance as Parameters<typeof calculateAttendanceScore>[0],
  );
  const loyaltyScore = calculateLoyaltyScore(
    input.loyalty as Parameters<typeof calculateLoyaltyScore>[0],
  );
  const influenceScore = normalizeToScore(
    input.influenceSignal ?? 0,
    input.influenceCap ?? INFLUENCE_CAP_DEFAULT,
  );

  const compositeScore = clampScore(
    engagementScore * COMPOSITE_WEIGHTS.engagement +
      purchaseScore * COMPOSITE_WEIGHTS.purchase +
      attendanceScore * COMPOSITE_WEIGHTS.attendance +
      influenceScore * COMPOSITE_WEIGHTS.influence +
      loyaltyScore * COMPOSITE_WEIGHTS.loyalty,
  );

  const tier = classifyFanTier(compositeScore, engagementScore);

  return {
    engagementScore,
    purchaseScore,
    attendanceScore,
    influenceScore,
    loyaltyScore,
    tier,
    compositeScore,
  };
}

export { classifyFanTier };
