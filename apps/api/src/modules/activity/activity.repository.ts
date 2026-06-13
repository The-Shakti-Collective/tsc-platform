import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  ACTIVITY_STUB_TYPE_MAP,
  type ActivityActionValue,
  type ActivityVisibilityValue,
  activityInclude,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { ActivityFeedQuery } from './dto';

export interface RecordActivityInput {
  actorPersonId: string;
  action: ActivityActionValue;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  visibility?: ActivityVisibilityValue;
  timestamp?: Date;
}

export interface ActivityStubEvent {
  type: string;
  actorId: string;
  entityType: string;
  entityId: string;
  targetEntityType?: string;
  targetEntityId?: string;
  metadata?: Record<string, unknown>;
}

type ActivityRow = {
  id: string;
  actorPersonId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Prisma.JsonValue;
  timestamp: Date;
  visibility: string;
  actor?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile?: { slug: string; username: string | null } | null;
  };
};

type ActivityClient = {
  create: (args: unknown) => Promise<ActivityRow>;
  findMany: (args: unknown) => Promise<ActivityRow[]>;
  count: (args: unknown) => Promise<number>;
};

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get activityClient(): ActivityClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      activity?: ActivityClient;
    };
    return client.activity ?? null;
  }

  isAvailable(): boolean {
    return this.activityClient != null;
  }

  create(input: RecordActivityInput) {
    if (!this.activityClient) return Promise.resolve(null);
    return this.activityClient.create({
      data: {
        id: newId(),
        actorPersonId: input.actorPersonId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: toInputJson(input.metadata ?? {}),
        visibility: input.visibility ?? 'public',
        timestamp: input.timestamp ?? new Date(),
      },
      include: activityInclude,
    });
  }

  listByActorIds(actorIds: string[], query: ActivityFeedQuery) {
    if (!this.activityClient || actorIds.length === 0) {
      return Promise.resolve({ rows: [] as ActivityRow[], total: 0 });
    }

    const where = {
      actorPersonId: { in: actorIds },
      visibility: { in: ['public', 'followers'] },
    };

    const skip = (query.page - 1) * query.limit;
    return Promise.all([
      this.activityClient.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: query.limit,
        include: activityInclude,
      }),
      this.activityClient.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  listByActor(actorPersonId: string, query: ActivityFeedQuery) {
    if (!this.activityClient) {
      return Promise.resolve({ rows: [] as ActivityRow[], total: 0 });
    }

    const where = {
      actorPersonId,
      visibility: 'public',
    };
    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      this.activityClient.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: query.limit,
        include: activityInclude,
      }),
      this.activityClient.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  listByCommunity(communityId: string, query: ActivityFeedQuery) {
    if (!this.activityClient) {
      return Promise.resolve({ rows: [] as ActivityRow[], total: 0 });
    }

    const where = {
      OR: [
        {
          targetType: 'Community',
          targetId: communityId,
        },
        {
          action: { in: ['joined_community', 'left_community'] },
          metadata: {
            path: ['communityId'],
            equals: communityId,
          },
        },
      ],
      visibility: 'public',
    };
    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      this.activityClient.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: query.limit,
        include: activityInclude,
      }),
      this.activityClient.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  listTrendingStub(query: ActivityFeedQuery) {
    if (!this.activityClient) {
      return Promise.resolve({ rows: [] as ActivityRow[], total: 0 });
    }

    const where = { visibility: 'public' };
    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      this.activityClient.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: query.limit,
        include: activityInclude,
      }),
      this.activityClient.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  listFollowingPersonIds(followerPersonId: string): Promise<string[]> {
    const followClient = (
      this.prisma.client as Prisma.TransactionClient & {
        personFollow?: {
          findMany: (args: unknown) => Promise<Array<{ followingPersonId: string }>>;
        };
      }
    ).personFollow;

    if (!followClient) return Promise.resolve([]);

    return followClient
      .findMany({
        where: { followerPersonId },
        select: { followingPersonId: true },
      })
      .then((rows) => rows.map((r) => r.followingPersonId));
  }

  resolveEntityTitles(
    refs: Array<{ entityType: string; entityId: string }>,
  ) {
    if (refs.length === 0) return Promise.resolve(new Map<string, string>());

    const byType = new Map<string, string[]>();
    for (const ref of refs) {
      const ids = byType.get(ref.entityType) ?? [];
      ids.push(ref.entityId);
      byType.set(ref.entityType, ids);
    }

    const lookups: Promise<Array<{ id: string; title: string }>>[] = [];

    const communityIds = byType.get('Community');
    if (communityIds?.length) {
      lookups.push(
        this.prisma.client.community
          .findMany({
            where: { id: { in: communityIds } },
            select: { id: true, name: true },
          })
          .then((rows) => rows.map((r) => ({ id: r.id, title: r.name }))),
      );
    }

    const eventIds = byType.get('Event');
    if (eventIds?.length) {
      lookups.push(
        this.prisma.client.event
          .findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true },
          })
          .then((rows) => rows.map((r) => ({ id: r.id, title: r.title }))),
      );
    }

    const opportunityIds = byType.get('Opportunity');
    if (opportunityIds?.length) {
      lookups.push(
        this.prisma.client.opportunity
          .findMany({
            where: { id: { in: opportunityIds } },
            select: { id: true, title: true },
          })
          .then((rows) => rows.map((r) => ({ id: r.id, title: r.title }))),
      );
    }

    const collaborationIds = byType.get('Collaboration');
    if (collaborationIds?.length) {
      const collabClient = (
        this.prisma.client as Prisma.TransactionClient & {
          collaboration?: {
            findMany: (args: unknown) => Promise<Array<{ id: string; title: string }>>;
          };
        }
      ).collaboration;
      if (collabClient) {
        lookups.push(
          collabClient
            .findMany({
              where: { id: { in: collaborationIds } },
              select: { id: true, title: true },
            })
            .then((rows) => rows.map((r) => ({ id: r.id, title: r.title }))),
        );
      }
    }

    const personIds = byType.get('Person');
    if (personIds?.length) {
      lookups.push(
        this.prisma.client.person
          .findMany({
            where: { id: { in: personIds } },
            select: { id: true, displayName: true, name: true },
          })
          .then((rows) =>
            rows.map((r) => ({
              id: r.id,
              title: r.displayName ?? r.name ?? r.id,
            })),
          ),
      );
    }

    return Promise.all(lookups).then((groups) => {
      const map = new Map<string, string>();
      let groupIndex = 0;
      for (const [entityType, ids] of byType.entries()) {
        const group = groups[groupIndex++] ?? [];
        for (const row of group) {
          if (ids.includes(row.id)) {
            map.set(`${entityType}:${row.id}`, row.title);
          }
        }
      }
      return map;
    });
  }

  listActiveCommunityIdsForPerson(personId: string) {
    const memberClient = (
      this.prisma.client as Prisma.TransactionClient & {
        communityMember?: {
          findMany: (args: unknown) => Promise<Array<{ communityId: string }>>;
        };
      }
    ).communityMember;

    if (!memberClient) return Promise.resolve([] as string[]);

    return memberClient
      .findMany({
        where: { personId, status: 'active' },
        select: { communityId: true },
      })
      .then((rows) => rows.map((r) => r.communityId));
  }

  stubTypeToAction(type: string): ActivityActionValue | null {
    return ACTIVITY_STUB_TYPE_MAP[type] ?? null;
  }
}

export type { ActivityRow };
