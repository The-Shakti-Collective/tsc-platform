import type { ReputationScoreKey, ReputationScores } from '@tsc/database';

export interface ReputationSnapshotPayload {
  entityType: 'Person' | 'Artist' | 'Community';
  entityId: string;
  snapshotDate: string;
  artistReputation?: number | null;
  communityReputation?: number | null;
  organizerReputation?: number | null;
  scores: ReputationScores;
  overallScore: number;
  rankPercentile?: number | null;
  updatedAt: string;
}

export interface ReputationRefreshPayload {
  entityType: 'Person' | 'Artist' | 'Community';
  entityId: string;
  snapshot: ReputationSnapshotPayload;
  profileUpdated: boolean;
}

export type { ReputationScoreKey, ReputationScores };
