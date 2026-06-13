import type { AudienceIntelligenceInput, AudienceSnapshotScores } from '@tsc/types';
import { clampScore } from '../intelligence/utils.js';

export function calculateAudienceScores(input: AudienceIntelligenceInput): AudienceSnapshotScores {
  const attendance = input.attendance as
    | { eventsAttended?: number; eventsInvited?: number }
    | undefined;
  const community = input.community as { postsCount?: number } | undefined;
  const spending = input.spending as { totalSpendLast90Days?: number } | undefined;
  const engagement = input.engagement as { contentInteractions?: number } | undefined;
  const loyalty = input.loyalty as { tenureDays?: number } | undefined;

  const attended = attendance?.eventsAttended ?? 0;
  const invited = attendance?.eventsInvited ?? 1;
  const posts = community?.postsCount ?? 0;
  const spend = spending?.totalSpendLast90Days ?? 0;
  const signals = engagement?.contentInteractions ?? 0;

  const attendanceScore = clampScore((attended / Math.max(invited, 1)) * 100);
  const engagementScore = clampScore(Math.min(signals * 5, 100));
  const spendingScore = clampScore(Math.min(spend / 1000, 100));
  const loyaltyScore = clampScore(Math.min((loyalty?.tenureDays ?? 0) / 3, 100));
  const communityScore = clampScore(Math.min(posts * 8, 100));

  const compositeScore = clampScore(
    attendanceScore * 0.25 +
      engagementScore * 0.25 +
      spendingScore * 0.2 +
      loyaltyScore * 0.15 +
      communityScore * 0.15,
  );

  return {
    attendanceScore,
    engagementScore,
    spendingScore,
    loyaltyScore,
    communityScore,
    compositeScore,
    calculatedAt: new Date().toISOString(),
  };
}

export function toSnapshotScores(scores: AudienceSnapshotScores): AudienceSnapshotScores {
  return scores;
}
