import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { normalizeCommunityMemberRole } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type {
  CommunityAddMemberInput,
  CommunityCreateOpportunityInput,
  CommunityLeaderSettingsInput,
  CommunityMemberRolePatchInput,
  CommunityMembersQuery,
} from './dto';

const MEMBER_OF = 'MEMBER_OF';
const MANAGES = 'MANAGES';

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

@Injectable()
export class CommunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCommunity(id: string) {
    return this.prisma.client.community.findUnique({
      where: { id },
      include: {
        artist: {
          select: { id: true, displayName: true, slug: true, name: true },
        },
        _count: { select: { members: true, posts: true } },
      },
    });
  }

  findLatestIntelligenceSnapshot(communityId: string) {
    return this.prisma.client.communityIntelligenceSnapshot.findFirst({
      where: { communityId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  countActiveMembersSince(communityId: string, since: Date) {
    return this.prisma.client.communityPost.findMany({
      where: { communityId, publishedAt: { gte: since } },
      select: { authorId: true },
      distinct: ['authorId'],
    });
  }

  listTopContributors(communityId: string, since: Date, limit = 5) {
    return this.prisma.client.communityPost.groupBy({
      by: ['authorId'],
      where: { communityId, publishedAt: { gte: since } },
      _count: { authorId: true },
      orderBy: { _count: { authorId: 'desc' } },
      take: limit,
    });
  }

  resolvePersonNames(personIds: string[]) {
    if (personIds.length === 0) return Promise.resolve([]);
    return this.prisma.client.person.findMany({
      where: { id: { in: personIds } },
      select: { id: true, displayName: true, name: true },
    });
  }

  listLinkedArtists(communityId: string, artistId?: string | null) {
    const queries: Promise<Array<{ id: string; displayName: string | null; slug: string | null; name: string | null }>>[] =
      [
        this.prisma.client.relationship
          .findMany({
            where: {
              targetEntityType: 'Community',
              targetEntityId: communityId,
              sourceEntityType: 'Artist',
              relationshipType: MEMBER_OF,
            },
            take: 20,
          })
          .then(async (edges) => {
            const ids = edges.map((edge) => edge.sourceEntityId);
            if (ids.length === 0) return [];
            return this.prisma.client.artist.findMany({
              where: { id: { in: ids } },
              select: { id: true, displayName: true, slug: true, name: true },
            });
          }),
      ];

    if (artistId) {
      queries.push(
        this.prisma.client.artist.findMany({
          where: { id: artistId },
          select: { id: true, displayName: true, slug: true, name: true },
        }),
      );
    }

    return Promise.all(queries).then((groups) => {
      const byId = new Map<string, { id: string; displayName: string | null; slug: string | null; name: string | null }>();
      for (const group of groups) {
        for (const artist of group) {
          byId.set(artist.id, artist);
        }
      }
      return [...byId.values()];
    });
  }

  listUpcomingEvents(communityId: string, artistId?: string | null, limit = 10) {
    const where: Prisma.EventWhereInput = {
      startsAt: { gte: new Date() },
    };
    if (artistId) {
      where.artistId = artistId;
    }

    return this.prisma.client.event.findMany({
      where,
      include: {
        venue: { select: { name: true, city: true } },
      },
      orderBy: { startsAt: 'asc' },
      take: limit,
    });
  }

  listMembers(communityId: string, query: CommunityMembersQuery) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.CommunityMemberWhereInput = {
      communityId,
      status: query.status ?? 'active',
    };
    if (query.role) where.role = query.role;

    return Promise.all([
      this.prisma.client.communityMember.findMany({
        where,
        include: {
          person: {
            select: {
              id: true,
              displayName: true,
              name: true,
            },
          },
        },
        orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.client.communityMember.count({ where }),
    ]);
  }

  countMemberPostsSince(personId: string, communityId: string, since: Date) {
    return this.prisma.client.communityPost.count({
      where: { authorId: personId, communityId, publishedAt: { gte: since } },
    });
  }

  findPersonLastPostAt(personId: string, communityId: string) {
    return this.prisma.client.communityPost.findFirst({
      where: { authorId: personId, communityId },
      orderBy: { publishedAt: 'desc' },
      select: { publishedAt: true },
    });
  }

  findPerson(id: string) {
    return this.prisma.client.person.findUnique({ where: { id } });
  }

  findMember(communityId: string, personId: string) {
    return this.prisma.client.communityMember.findUnique({
      where: { communityId_personId: { communityId, personId } },
    });
  }

  upsertMember(communityId: string, input: CommunityAddMemberInput) {
    const role = normalizeCommunityMemberRole(input.role);
    return this.prisma.client.communityMember.upsert({
      where: { communityId_personId: { communityId, personId: input.personId } },
      create: {
        id: newId(),
        communityId,
        personId: input.personId,
        role,
        status: 'active',
        joinedAt: new Date(),
        leftAt: null,
      },
      update: {
        role,
        status: 'active',
        leftAt: null,
      },
      include: {
        person: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
      },
    });
  }

  joinMember(communityId: string, personId: string) {
    return this.upsertMember(communityId, { personId, role: 'Member' });
  }

  leaveMember(communityId: string, personId: string) {
    const leftAt = new Date();
    return this.prisma.client.communityMember.update({
      where: { communityId_personId: { communityId, personId } },
      data: {
        status: 'left',
        leftAt,
      },
    });
  }

  updateMemberRole(
    communityId: string,
    personId: string,
    input: CommunityMemberRolePatchInput,
  ) {
    const role = normalizeCommunityMemberRole(input.role);
    return this.prisma.client.communityMember.update({
      where: { communityId_personId: { communityId, personId } },
      data: { role },
      include: {
        person: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
      },
    });
  }

  upsertMemberOfRelationship(communityId: string, personId: string) {
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: 'Community',
            targetEntityId: communityId,
            relationshipType: MEMBER_OF,
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Community',
        targetEntityId: communityId,
        relationshipType: MEMBER_OF,
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'community-os', status: 'active' }),
      },
      update: {
        effectiveTo: null,
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'community-os', status: 'active' }),
      },
    });
  }

  endMemberOfRelationship(communityId: string, personId: string) {
    return this.prisma.client.relationship.updateMany({
      where: {
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Community',
        targetEntityId: communityId,
        relationshipType: MEMBER_OF,
        effectiveTo: null,
      },
      data: {
        effectiveTo: new Date(),
      },
    });
  }

  findMemberOfRelationship(communityId: string, personId: string) {
    return this.prisma.client.relationship.findFirst({
      where: {
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Community',
        targetEntityId: communityId,
        relationshipType: MEMBER_OF,
      },
    });
  }

  personManagesCommunity(communityId: string, personId: string) {
    return Promise.all([
      this.prisma.client.relationship.findFirst({
        where: {
          sourceEntityType: 'Person',
          sourceEntityId: personId,
          targetEntityType: 'Community',
          targetEntityId: communityId,
          relationshipType: MANAGES,
        },
      }),
      this.prisma.client.personRole.findFirst({
        where: {
          personId,
          role: 'community_leader',
          entityType: 'Community',
          entityId: communityId,
        },
      }),
      this.prisma.client.communityMember.findFirst({
        where: {
          communityId,
          personId,
          status: 'active',
          role: { in: ['Founder', 'Moderator'] },
        },
      }),
    ]).then(([managesEdge, leaderRole, leaderMember]) =>
      Boolean(managesEdge || leaderRole || leaderMember),
    );
  }

  createCommunityOpportunity(
    communityId: string,
    input: CommunityCreateOpportunityInput,
    actorId?: string | null,
  ) {
    return this.prisma.client.opportunity.create({
      data: {
        id: newId(),
        title: input.title,
        status: 'open',
        source: 'community',
        category: input.category ?? 'open_call',
        value: input.value ?? null,
        deadline: input.deadline ? new Date(input.deadline) : null,
        marketplaceVisible: input.marketplaceVisible ?? true,
        metadata: toInputJson({
          ...(input.metadata ?? {}),
          communityId,
          description: input.description ?? null,
          assignedToId: actorId ?? null,
          createdVia: 'community-os',
        }),
      },
    });
  }

  updateCommunitySettings(
    communityId: string,
    input: CommunityLeaderSettingsInput,
    _existingMetadata: Prisma.JsonValue | null,
  ) {
    const welcomeMessage =
      typeof input.metadata?.welcomeMessage === 'string'
        ? input.metadata.welcomeMessage
        : undefined;

    return this.prisma.client.community.update({
      where: { id: communityId },
      data: {
        ...(welcomeMessage !== undefined ? { description: welcomeMessage } : {}),
      },
    });
  }

  since30Days() {
    return daysAgo(30);
  }
}

export function displayPersonName(person: {
  displayName: string | null;
  name: string | null;
  id?: string;
}): string {
  if (person.displayName?.trim()) return person.displayName.trim();
  if (person.name?.trim()) return person.name.trim();
  return person.id || 'Member';
}

export function displayArtistName(artist: {
  displayName: string | null;
  name: string | null;
  slug: string | null;
  id: string;
}): string {
  return artist.displayName ?? artist.name ?? artist.slug ?? artist.id;
}
