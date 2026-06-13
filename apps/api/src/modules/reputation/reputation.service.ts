import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  clampScore,
  computeWeightedOverall,
  type ReputationEntityTypeValue,
  type ReputationScores,
} from '@tsc/database';
import type {
  ReputationRefreshPayload,
  ReputationSnapshotPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { ReputationRepository } from './reputation.repository';

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function parseScores(value: unknown): ReputationScores {
  const defaults: ReputationScores = {
    events: 0,
    communities: 0,
    collaborations: 0,
    opportunitySuccess: 0,
    memberActivity: 0,
    retention: 0,
    attendance: 0,
    reviews: 0,
  };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(defaults) as Array<keyof ReputationScores>) {
    if (typeof record[key] === 'number') defaults[key] = record[key] as number;
  }
  return defaults;
}

@Injectable()
export class ReputationService {
  constructor(private readonly repository: ReputationRepository) {}

  async getPersonReputation(personId: string): Promise<ReputationSnapshotPayload> {
    this.assertAvailable();
    const snapshot = await this.repository.findLatestSnapshot('Person', personId);
    if (snapshot) return this.toPayload(snapshot);
    return this.computePersonReputation(personId);
  }

  async getCommunityReputation(communityId: string): Promise<ReputationSnapshotPayload> {
    this.assertAvailable();
    const snapshot = await this.repository.findLatestSnapshot('Community', communityId);
    if (snapshot) return this.toPayload(snapshot);
    return this.computeCommunityReputation(communityId);
  }

  async refresh(
    entityType: ReputationEntityTypeValue,
    entityId: string,
    ctx: MembershipContext,
  ): Promise<ReputationRefreshPayload> {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin access required to refresh reputation');
    }

    const snapshot =
      entityType === 'Person'
        ? await this.computePersonReputation(entityId)
        : entityType === 'Community'
          ? await this.computeCommunityReputation(entityId)
          : await this.computePersonReputation(entityId);

    return {
      entityType,
      entityId,
      snapshot,
      profileUpdated: entityType === 'Person',
    };
  }

  async computePersonReputation(personId: string): Promise<ReputationSnapshotPayload> {
    this.assertAvailable();
    const since30d = daysAgo(30);
    const retentionCutoff = daysAgo(30);

    const [
      checkedIn,
      registered,
      communities,
      collaborations,
      opportunities,
      activityCount,
      longTermMemberships,
      organizerStats,
    ] = await Promise.all([
      this.repository.countCheckedInEvents(personId),
      this.repository.countRegisteredEvents(personId),
      this.repository.countActiveCommunities(personId),
      this.repository.countAcceptedCollaborations(personId),
      this.repository.countWonOpportunities(personId),
      this.repository.countActivitiesSince(personId, since30d),
      this.repository.countLongTermMemberships(personId, retentionCutoff),
      this.repository.countOrganizerAttendance(personId),
    ]);

    const attendanceRate =
      registered > 0 ? clampScore((checkedIn / registered) * 100) : checkedIn > 0 ? 100 : 0;

    const scores: ReputationScores = {
      events: clampScore(checkedIn * 10),
      communities: clampScore(communities * 15),
      collaborations: clampScore(collaborations * 20),
      opportunitySuccess: clampScore(opportunities * 25),
      memberActivity: clampScore(activityCount * 5),
      retention: longTermMemberships > 0 ? 75 : communities > 0 ? 40 : 0,
      attendance: attendanceRate,
      reviews: 0,
    };

    const overallScore = computeWeightedOverall(scores);
    const organizerReputation = clampScore(
      organizerStats.organized * 12 +
        (organizerStats.organized > 0
          ? (organizerStats.attended / organizerStats.organized) * 30
          : 0),
    );

    const rankPercentile = await this.computeRankPercentile('Person', overallScore);
    const row = await this.repository.createSnapshot({
      entityType: 'Person',
      entityId: personId,
      organizerReputation,
      scores,
      overallScore,
      rankPercentile,
    });

    await this.repository.updateProfileScores(personId, overallScore, overallScore);

    return row ? this.toPayload(row) : this.buildPayload('Person', personId, scores, overallScore, {
      organizerReputation,
      rankPercentile,
    });
  }

  async computeCommunityReputation(communityId: string): Promise<ReputationSnapshotPayload> {
    this.assertAvailable();
    const since30d = daysAgo(30);

    const [memberCount, activeMembers, eventCount] = await Promise.all([
      this.repository.countCommunityMembers(communityId),
      this.repository.countActiveCommunityMembersSince(communityId, since30d),
      this.repository.countCommunityEvents(communityId),
    ]);

    const engagementRate =
      memberCount > 0 ? clampScore((activeMembers / memberCount) * 100) : 0;

    const scores: ReputationScores = {
      events: clampScore(eventCount * 8),
      communities: clampScore(memberCount * 2),
      collaborations: 0,
      opportunitySuccess: 0,
      memberActivity: engagementRate,
      retention: memberCount > 10 ? 60 : memberCount > 0 ? 35 : 0,
      attendance: engagementRate,
      reviews: 0,
    };

    const overallScore = computeWeightedOverall(scores);
    const rankPercentile = await this.computeRankPercentile('Community', overallScore);

    const row = await this.repository.createSnapshot({
      entityType: 'Community',
      entityId: communityId,
      communityReputation: overallScore,
      scores,
      overallScore,
      rankPercentile,
    });

    return row
      ? this.toPayload(row)
      : this.buildPayload('Community', communityId, scores, overallScore, {
          communityReputation: overallScore,
          rankPercentile,
        });
  }

  async computeOrganizerReputation(personId: string): Promise<number> {
    const stats = await this.repository.countOrganizerAttendance(personId);
    return clampScore(
      stats.organized * 12 +
        (stats.organized > 0 ? (stats.attended / stats.organized) * 30 : 0),
    );
  }

  private async computeRankPercentile(
    entityType: string,
    overallScore: number,
  ): Promise<number | null> {
    const scores = await this.repository.listOverallScores(entityType);
    if (scores.length === 0) return null;
    const below = scores.filter((score) => score < overallScore).length;
    return Math.round((below / scores.length) * 10000) / 100;
  }

  private toPayload(row: {
    entityType: string;
    entityId: string;
    snapshotDate: Date;
    artistReputation?: number | null;
    communityReputation?: number | null;
    organizerReputation?: number | null;
    scores: unknown;
    overallScore: number;
    rankPercentile?: number | null;
  }): ReputationSnapshotPayload {
    return {
      entityType: row.entityType as ReputationSnapshotPayload['entityType'],
      entityId: row.entityId,
      snapshotDate: row.snapshotDate.toISOString(),
      artistReputation: row.artistReputation ?? null,
      communityReputation: row.communityReputation ?? null,
      organizerReputation: row.organizerReputation ?? null,
      scores: parseScores(row.scores),
      overallScore: row.overallScore,
      rankPercentile: row.rankPercentile ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  private buildPayload(
    entityType: ReputationSnapshotPayload['entityType'],
    entityId: string,
    scores: ReputationScores,
    overallScore: number,
    extra: Partial<ReputationSnapshotPayload> = {},
  ): ReputationSnapshotPayload {
    return {
      entityType,
      entityId,
      snapshotDate: new Date().toISOString(),
      scores,
      overallScore,
      artistReputation: null,
      communityReputation: null,
      organizerReputation: null,
      rankPercentile: null,
      updatedAt: new Date().toISOString(),
      ...extra,
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException(
        'Reputation models not merged — apply phase6.5-reputation.prisma migration',
      );
    }
  }
}
