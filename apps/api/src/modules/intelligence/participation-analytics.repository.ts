import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';

export interface TopContributorRow {
  personId: string;
  displayName: string;
  activityCount: number;
}

@Injectable()
export class ParticipationAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  countDailyActiveMembers(since: Date) {
    const member = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        communityMember?: { count: (args: unknown) => Promise<number> };
      }
    ).communityMember;
    if (!member) return Promise.resolve(0);
    return member.count({
      where: { status: 'active', updatedAt: { gte: since } },
    });
  }

  countTotalActiveMembers() {
    const member = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        communityMember?: { count: (args: unknown) => Promise<number> };
      }
    ).communityMember;
    if (!member) return Promise.resolve(0);
    return member.count({ where: { status: 'active' } });
  }

  countCommunityJoinsSince(since: Date) {
    const member = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        communityMember?: { count: (args: unknown) => Promise<number> };
      }
    ).communityMember;
    if (!member) return Promise.resolve(0);
    return member.count({
      where: { status: 'active', joinedAt: { gte: since } },
    });
  }

  countNewCollaborationsSince(since: Date) {
    const collaboration = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        collaboration?: { count: (args: unknown) => Promise<number> };
      }
    ).collaboration;
    if (!collaboration) return Promise.resolve(0);
    return collaboration.count({
      where: { createdAt: { gte: since } },
    });
  }

  countPostedCollaborationsSince(since: Date) {
    const activity = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        activity?: { count: (args: unknown) => Promise<number> };
      }
    ).activity;
    if (!activity) return Promise.resolve(0);
    return activity.count({
      where: {
        action: 'posted_collaboration',
        timestamp: { gte: since },
      },
    });
  }

  async listTopContributors(since: Date, limit = 10): Promise<TopContributorRow[]> {
    const activity = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        activity?: {
          groupBy: (args: unknown) => Promise<Array<{ actorPersonId: string; _count: { _all: number } }>>;
        };
      }
    ).activity;
    if (!activity) return [];

    const groups = await (
      activity as {
        groupBy: (
          args: unknown,
        ) => Promise<Array<{ actorPersonId: string; _count: { _all: number } }>>;
      }
    ).groupBy({
      by: ['actorPersonId'],
      where: { timestamp: { gte: since }, visibility: 'public' },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: limit,
    });

    if (groups.length === 0) return [];

    const personIds = groups.map((g) => g.actorPersonId);
    const people = await this.prisma.client.person.findMany({
      where: { id: { in: personIds } },
      select: { id: true, displayName: true, name: true },
    });
    const nameById = new Map(
      people.map((p) => [p.id, p.displayName?.trim() || p.name?.trim() || p.id]),
    );

    return groups.map((group) => ({
      personId: group.actorPersonId,
      displayName: nameById.get(group.actorPersonId) ?? group.actorPersonId,
      activityCount: group._count._all,
    }));
  }

  averageReputationScore() {
    const profile = (
      this.prisma.client as unknown as Prisma.TransactionClient & {
        personProfile?: {
          aggregate: (args: unknown) => Promise<{ _avg: { reputationScore: number | null } }>;
        };
      }
    ).personProfile;
    if (!profile) return Promise.resolve(0);
    return profile
      .aggregate({
        where: { reputationScore: { not: null } },
        _avg: { reputationScore: true },
      })
      .then((result) => result._avg.reputationScore ?? 0);
  }
}
