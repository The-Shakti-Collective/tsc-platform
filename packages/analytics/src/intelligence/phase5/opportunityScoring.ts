import type { ScoreTier } from "@tsc/types";
import { clampScore, normalizeToScore } from "../utils.js";
import {
  PHASE5_SCORE_VERSION,
  type OpportunityScoringFactors,
  type OpportunityScoringInput,
  type OpportunityScoringResult,
} from "./types.js";

const REVENUE_BENCHMARK_DEFAULT = 500_000;
const TIMELINE_DAYS_CAP = 90;

const WEIGHTS = {
  revenuePotential: 0.25,
  artistMatch: 0.2,
  location: 0.15,
  engagement: 0.2,
  brandFit: 0.1,
  timeline: 0.1,
} as const;

function scoreTierFromScore(score: number): ScoreTier {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function timelineScore(daysToClose?: number): number {
  if (daysToClose === undefined || daysToClose < 0) return 50;
  if (daysToClose <= 7) return 100;
  if (daysToClose >= TIMELINE_DAYS_CAP) return 10;
  return clampScore(100 - (daysToClose / TIMELINE_DAYS_CAP) * 90);
}

function computeConfidence(factors: OpportunityScoringFactors): number {
  const values = Object.values(factors);
  const nonZero = values.filter((v) => v > 0).length;
  const coverage = nonZero / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.abs(v - 50), 0) / values.length / 50;
  return clampScore(coverage * 70 + (1 - Math.min(variance, 1)) * 30) / 100;
}

/**
 * Rule-based opportunity / lead score from revenue, fit, engagement, timeline.
 * Maps to `OpportunityScore` / `LeadScore` Prisma rows via persist layer.
 */
export function calculateOpportunityScore(
  input: OpportunityScoringInput,
): OpportunityScoringResult {
  const benchmark = input.revenueBenchmark ?? REVENUE_BENCHMARK_DEFAULT;

  const factors: OpportunityScoringFactors = {
    revenuePotential: normalizeToScore(input.revenuePotential ?? 0, benchmark),
    artistMatch: clampScore(input.artistMatch ?? 0),
    location: clampScore(input.locationFit ?? 0),
    engagement: clampScore(input.engagement ?? 0),
    brandFit: clampScore(input.brandFit ?? 0),
    timeline: timelineScore(input.daysToClose),
  };

  const score = clampScore(
    factors.revenuePotential * WEIGHTS.revenuePotential +
      factors.artistMatch * WEIGHTS.artistMatch +
      factors.location * WEIGHTS.location +
      factors.engagement * WEIGHTS.engagement +
      factors.brandFit * WEIGHTS.brandFit +
      factors.timeline * WEIGHTS.timeline,
  );

  return {
    opportunityId: input.opportunityId,
    score,
    tier: scoreTierFromScore(score),
    confidence: computeConfidence(factors),
    factors,
    calculatedAt: new Date().toISOString(),
    version: PHASE5_SCORE_VERSION,
  };
}

/** Alias for lead pipeline — same factors, person-scoped persist uses `LeadScore`. */
export function calculateLeadScoreFromOpportunity(
  input: OpportunityScoringInput,
): OpportunityScoringResult {
  return calculateOpportunityScore(input);
}
