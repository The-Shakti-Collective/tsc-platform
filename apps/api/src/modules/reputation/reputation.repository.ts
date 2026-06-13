import { Injectable } from '@nestjs/common';
import type { Prisma, ReputationScores } from '@tsc/database';
import { reputationSnapshotWhere } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';

type ReputationSnapshotClient = {
  findFirst: (args: unknown) => Promise<ReputationSnapshotRow | null>;
  create: (args: unknown) => Promise<ReputationSnapshotRow>;
  findMany: (args: unknown) => Promise<ReputationSnapshotRow[]>;
};

type ReputationSnapshotRow = {
  id: string;
  entityType: string;
  entityId: string;
  snapshotDate: Date;
  artistReputation: number | null;
  communityReputation: number | null;
  organizerReputation: number | null;
  scores: Prisma.JsonValue;
  overallScore: number;
  rankPercentile: number | null;
  createdAt: Date;
};

@Injectable()
export class ReputationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get snapshotClient(): ReputationSnapshotClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      reputationSnapshot?: ReputationSnapshotClient;
    };
    return client.reputationSnapshot ?? null;
  }

  isAvailable(): boolean {
    return this.snapshotClient != null;
  }

  findLatestSnapshot(entityType: string, entityId: string) {
    if (!this.snapshotClient) return Promise.resolve(null);
    return this.snapshotClient.findFirst({
      where: reputationSnapshotWhere(
        entityType as 'Person' | 'Artist' | 'Community',
        entityId,
      ),
      orderBy: { snapshotDate: 'desc' },
    });
  }

  createSnapshot(input: {
    entityType: string;
    entityId: string;
    artistReputation?: number | null;
    communityReputation?: number | null;
    organizerReputation?: number | null;
    scores: ReputationScores;
    overallScore: number;
    rankPercentile?: number | null;
  }) {
    if (!this.snapshotClient) return Promise.resolve(null);
    const snapshotDate = new Date();
    return this.snapshotClient.create({
      data: {
        id: newId(),
        entityType: input.entityType,
        entityId: input.entityId,
        snapshotDate,
        artistReputation: input.artistReputation ?? null,
        communityReputation: input.communityReputation ?? null,
        organizerReputation: input.organizerReputation ?? null,
        scores: toInputJson(input.scores),
        overallScore: input.overallScore,
        rankPercentile: input.rankPercentile ?? null,
      },
    });
  }

  countCheckedInEvents(personId: string) {
    const participation = (
      this.prisma.client as Prisma.TransactionClient & {
        eventParticipation?: { count: (args: unknown) => Promise<number> };
      }
    ).eventParticipation;
    if (!participation) return Promise.resolve(0);
    return participation.count({
      where: { personId, status: 'checked_in' },
    });
  }

  countRegisteredEvents(personId: string) {
    const participation = (
      this.prisma.client as Prisma.TransactionClient & {
        eventParticipation?: { count: (args: unknown) => Promise<number> };
      }
    ).eventParticipation;
    if (!participation) return Promise.resolve(0);
    return participation.count({
      where: { personId, status: { in: ['registered', 'checked_in'] } },
    });
  }

  countActiveCommunities(personId: string) {
    const member = (
      this.prisma.client as Prisma.TransactionClient & {
        communityMember?: { count: (args: unknown) => Promise<number> };
      }
    ).communityMember;
    if (!member) return Promise.resolve(0);
    return member.count({ where: { personId, status: 'active' } });
  }

  countAcceptedCollaborations(personId: string) {
    const application = (
      this.prisma.client as Prisma.TransactionClient & {
        collaborationApplication?: { count: (args: unknown) => Promise<number> };
      }
    ).collaborationApplication;
    if (!application) return Promise.resolve(0);
    return application.count({
      where: { applicantPersonId: personId, status: 'accepted' },
    });
  }

  countWonOpportunities(personId: string) {
    return this.prisma.client.opportunityApplication.count({
      where: { personId, status: 'won' },
    });
  }

  countActivitiesSince(personId: string, since: Date) {
    const activity = (
      this.prisma.client as Prisma.TransactionClient & {
        activity?: { count: (args: unknown) => Promise<number> };
      }
    ).activity;
    if (!activity) return Promise.resolve(0);
    return activity.count({
      where: { actorPersonId: personId, timestamp: { gte: since } },
    });
  }

  countLongTermMemberships(personId: string, before: Date) {
    const member = (
      this.prisma.client as Prisma.TransactionClient & {
        communityMember?: { count: (args: unknown) => Promise<number> };
      }
    ).communityMember;
    if (!member) return Promise.resolve(0);
    return member.count({
      where: { personId, status: 'active', joinedAt: { lte: before } },
    });
  }

  countCommunityMembers(communityId: string) {
    const member = (
      this.prisma.client as Prisma.TransactionClient & {
        communityMember?: { count: (args: unknown) => Promise<number> };
      }
    ).communityMember;
    if (!member) return Promise.resolve(0);
    return member.count({ where: { communityId, status: 'active' } });
  }

  countActiveCommunityMembersSince(communityId: string, since: Date) {
    const member = (
      this.prisma.client as Prisma.TransactionClient & {
        communityMember?: { count: (args: unknown) => Promise<number> };
      }
    ).communityMember;
    if (!member) return Promise.resolve(0);
    return member.count({
      where: { communityId, status: 'active', updatedAt: { gte: since } },
    });
  }

  countCommunityEvents(communityId: string) {
    return this.prisma.client.event.count({
      where: { artist: { communities: { some: { id: communityId } } } },
    });
  }

  countOrganizedEvents(personId: string) {
    const participation = (
      this.prisma.client as Prisma.TransactionClient & {
        eventParticipation?: { count: (args: unknown) => Promise<number> };
      }
    ).eventParticipation;
    if (!participation) return Promise.resolve(0);
    return participation.count({
      where: { personId, role: 'Organizer' },
    });
  }

  countOrganizerAttendance(personId: string) {
    const participation = (
      this.prisma.client as Prisma.TransactionClient & {
        eventParticipation?: {
          findMany: (args: unknown) => Promise<Array<{ eventId: string }>>;
        };
      }
    ).eventParticipation;
    if (!participation) return Promise.resolve({ organized: 0, attended: 0 });

    return participation
      .findMany({
        where: { personId, role: 'Organizer' },
        select: { eventId: true },
      })
      .then(async (organized) => {
        if (organized.length === 0) return { organized: 0, attended: 0 };
        const eventIds = organized.map((row) => row.eventId);
        const attended = await (
          this.prisma.client as Prisma.TransactionClient & {
            eventParticipation?: { count: (args: unknown) => Promise<number> };
          }
        ).eventParticipation?.count({
          where: {
            eventId: { in: eventIds },
            status: 'checked_in',
            personId: { not: personId },
          },
        });
        return { organized: organized.length, attended: attended ?? 0 };
      });
  }

  listOverallScores(entityType: string) {
    if (!this.snapshotClient) return Promise.resolve([] as number[]);
    return this.snapshotClient
      .findMany({
        where: { entityType },
        orderBy: { snapshotDate: 'desc' },
        take: 500,
        select: { entityId: true, overallScore: true, snapshotDate: true },
      })
      .then((rows) => {
        const latestByEntity = new Map<string, number>();
        for (const row of rows) {
          if (!latestByEntity.has(row.entityId)) {
            latestByEntity.set(row.entityId, row.overallScore);
          }
        }
        return [...latestByEntity.values()];
      });
  }

  updateProfileScores(personId: string, reputationScore: number, ecosystemScore: number) {
    const profile = (
      this.prisma.client as Prisma.TransactionClient & {
        personProfile?: {
          update: (args: unknown) => Promise<unknown>;
        };
      }
    ).personProfile;
    if (!profile) return Promise.resolve(false);
    return profile
      .update({
        where: { personId },
        data: { reputationScore, ecosystemScore },
      })
      .then(() => true)
      .catch(() => false);
  }
}
