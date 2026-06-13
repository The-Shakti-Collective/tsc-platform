import type { Prisma } from '@prisma/client';

export const REPUTATION_ENTITY_TYPES = ['Person', 'Artist', 'Community'] as const;
export type ReputationEntityTypeValue = (typeof REPUTATION_ENTITY_TYPES)[number];

export const REPUTATION_SCORE_KEYS = [
  'events',
  'communities',
  'collaborations',
  'opportunitySuccess',
  'memberActivity',
  'retention',
  'attendance',
  'reviews',
] as const;

export type ReputationScoreKey = (typeof REPUTATION_SCORE_KEYS)[number];

export type ReputationScores = Record<ReputationScoreKey, number>;

export const REPUTATION_WEIGHTS: Record<ReputationScoreKey, number> = {
  events: 0.15,
  communities: 0.1,
  collaborations: 0.2,
  opportunitySuccess: 0.25,
  memberActivity: 0.1,
  retention: 0.05,
  attendance: 0.1,
  reviews: 0.05,
};

export function computeWeightedOverall(scores: ReputationScores): number {
  let total = 0;
  for (const key of REPUTATION_SCORE_KEYS) {
    total += (scores[key] ?? 0) * REPUTATION_WEIGHTS[key];
  }
  return Math.round(total * 100) / 100;
}

export function clampScore(value: number, max = 100): number {
  return Math.min(max, Math.max(0, Math.round(value * 100) / 100));
}

export function reputationSnapshotWhere(
  entityType: ReputationEntityTypeValue,
  entityId: string,
): Prisma.ReputationSnapshotWhereInput {
  return { entityType, entityId };
}
