import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  activePersonWhere,
  FOLLOWS_RELATIONSHIP,
  personFollowInclude,
  personProfileInclude,
  profileSlugWhere,
  profileUsernameWhere,
  slugifyProfileHandle,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { ProfileEditInput } from './dto';

type PersonProfileClient = {
  findFirst: (args: unknown) => Promise<PersonProfileRow | null>;
  findUnique: (args: unknown) => Promise<PersonProfileRow | null>;
  create: (args: unknown) => Promise<PersonProfileRow>;
  update: (args: unknown) => Promise<PersonProfileRow>;
};

type PersonVerificationRequestClient = {
  create: (args: unknown) => Promise<{ id: string }>;
};

type PersonFollowClient = {
  findUnique: (args: unknown) => Promise<PersonFollowRow | null>;
  create: (args: unknown) => Promise<PersonFollowRow>;
  delete: (args: unknown) => Promise<PersonFollowRow>;
  findMany: (args: unknown) => Promise<PersonFollowRow[]>;
  count: (args: unknown) => Promise<number>;
};

export type PersonFollowRow = {
  id: string;
  followerPersonId: string;
  followingPersonId: string;
  createdAt: Date;
  follower?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile?: { slug: string; username: string | null } | null;
  };
  following?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile?: { slug: string; username: string | null } | null;
  };
};

export type PersonProfileRow = {
  id: string;
  personId: string;
  username: string | null;
  slug: string;
  bio: string | null;
  city: string | null;
  genres: string[];
  skills: string[];
  links: Prisma.JsonValue;
  verificationLevel: number;
  reputationScore: number | null;
  ecosystemScore: number | null;
  adminVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    mergedIntoId: string | null;
  };
};

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get profileClient(): PersonProfileClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      personProfile?: PersonProfileClient;
    };
    return client.personProfile ?? null;
  }

  private get verificationRequestClient(): PersonVerificationRequestClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      personVerificationRequest?: PersonVerificationRequestClient;
    };
    return client.personVerificationRequest ?? null;
  }

  private get followClient(): PersonFollowClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      personFollow?: PersonFollowClient;
    };
    return client.personFollow ?? null;
  }

  findBySlug(slug: string) {
    if (!this.profileClient) return Promise.resolve(null);
    return this.profileClient.findFirst({
      where: profileSlugWhere(slug),
      include: personProfileInclude,
    });
  }

  findByPersonId(personId: string) {
    if (!this.profileClient) return Promise.resolve(null);
    return this.profileClient.findUnique({
      where: { personId },
      include: personProfileInclude,
    });
  }

  findByUsername(username: string) {
    if (!this.profileClient) return Promise.resolve(null);
    return this.profileClient.findFirst({
      where: profileUsernameWhere(username),
      include: personProfileInclude,
    });
  }

  isUsernameAvailable(username: string, excludePersonId?: string) {
    return this.findByUsername(username).then((row) => {
      if (!row) return true;
      if (excludePersonId && row.personId === excludePersonId) return true;
      return false;
    });
  }

  async createStub(input: {
    personId: string;
    slug?: string | null;
    username?: string | null;
    displayName?: string | null;
  }): Promise<PersonProfileRow | null> {
    if (!this.profileClient) return null;

    const existing = await this.findByPersonId(input.personId);
    if (existing) return existing;

    const base =
      input.slug ??
      (slugifyProfileHandle(input.username ?? input.displayName ?? input.personId) ||
        `person-${input.personId.slice(0, 8)}`);

    let slug = base;
    let suffix = 0;
    while (await this.findBySlug(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    return this.profileClient.create({
      data: {
        id: newId(),
        personId: input.personId,
        slug,
        username: input.username ?? null,
        links: toInputJson([]),
      },
      include: personProfileInclude,
    });
  }

  updateProfile(personId: string, input: ProfileEditInput) {
    if (!this.profileClient) {
      throw new Error('PersonProfile model unavailable');
    }

    const data: Record<string, unknown> = {};
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.city !== undefined) data.city = input.city;
    if (input.genres !== undefined) data.genres = input.genres;
    if (input.skills !== undefined) data.skills = input.skills;
    if (input.links !== undefined) data.links = toInputJson(input.links);
    if (input.username !== undefined) data.username = input.username;

    return this.profileClient.update({
      where: { personId },
      data,
      include: personProfileInclude,
    });
  }

  updateVerificationLevel(personId: string, level: number, adminVerified?: boolean) {
    if (!this.profileClient) return Promise.resolve(null);
    return this.profileClient.update({
      where: { personId },
      data: {
        verificationLevel: level,
        ...(adminVerified !== undefined ? { adminVerified } : {}),
      },
      include: personProfileInclude,
    });
  }

  createVerificationRequest(input: {
    personId: string;
    type: string;
    metadata?: Record<string, unknown>;
  }) {
    if (!this.verificationRequestClient) {
      return Promise.resolve({ id: `stub-${newId()}` });
    }

    return this.verificationRequestClient.create({
      data: {
        id: newId(),
        personId: input.personId,
        type: input.type,
        status: 'pending',
        metadata: toInputJson(input.metadata),
      },
    });
  }

  listActiveRoles(personId: string) {
    return this.prisma.client.personRole.findMany({
      where: { personId, status: 'active' },
      orderBy: { assignedAt: 'desc' },
    });
  }

  listIdentifiers(personId: string) {
    return this.prisma.client.personIdentifier.findMany({
      where: { personId, person: activePersonWhere() },
    });
  }

  listPersonRelationships(personId: string) {
    return this.prisma.client.relationship.findMany({
      where: {
        OR: [
          { sourceEntityType: 'Person', sourceEntityId: personId },
          { targetEntityType: 'Person', targetEntityId: personId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  resolveEntityTitles(
    refs: Array<{ entityType: string; entityId: string }>,
  ): Promise<Map<string, string>> {
    return this.prisma.client.$transaction(async (tx) => {
      const titles = new Map<string, string>();
      for (const ref of refs) {
        const key = `${ref.entityType}:${ref.entityId}`;
        if (titles.has(key)) continue;

        if (ref.entityType === 'Community') {
          const row = await tx.community.findUnique({
            where: { id: ref.entityId },
            select: { name: true },
          });
          titles.set(key, row?.name ?? ref.entityId);
          continue;
        }

        if (ref.entityType === 'Event') {
          const row = await tx.event.findUnique({
            where: { id: ref.entityId },
            select: { title: true },
          });
          titles.set(key, row?.title ?? ref.entityId);
          continue;
        }

        if (ref.entityType === 'Artist') {
          const row = await tx.artist.findUnique({
            where: { id: ref.entityId },
            select: { displayName: true, name: true, slug: true },
          });
          titles.set(
            key,
            row?.displayName ?? row?.name ?? row?.slug ?? ref.entityId,
          );
          continue;
        }

        titles.set(key, ref.entityId);
      }
      return titles;
    });
  }

  findArtistByPersonId(personId: string) {
    return this.prisma.client.artist.findFirst({
      where: { personId },
      select: {
        id: true,
        slug: true,
        displayName: true,
        name: true,
        photoUrl: true,
        bio: true,
        personId: true,
      },
    });
  }

  findArtistBySlug(slug: string) {
    return this.prisma.client.artist.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' } },
      select: {
        id: true,
        slug: true,
        displayName: true,
        name: true,
        photoUrl: true,
        bio: true,
        personId: true,
      },
    });
  }

  findPersonIdByArtistId(artistId: string) {
    return this.prisma.client.artist
      .findUnique({
        where: { id: artistId },
        select: { personId: true },
      })
      .then((row) => row?.personId ?? null);
  }

  findPersonByCoreKnotUser(userId: string) {
    return this.prisma.client.personIdentifier.findFirst({
      where: {
        provider: 'coreknot_user',
        externalId: userId,
        person: activePersonWhere(),
      },
      select: { personId: true },
    });
  }

  listOpportunityApplications(personId: string) {
    return this.prisma.client.opportunityApplication.findMany({
      where: { personId },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            metadata: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: 50,
    });
  }

  hasCommunityLeadership(personId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const leaderRole = await tx.personRole.findFirst({
        where: {
          personId,
          status: 'active',
          role: 'community_leader',
        },
      });
      if (leaderRole) return true;

      const manages = await tx.relationship.findFirst({
        where: {
          sourceEntityType: 'Person',
          sourceEntityId: personId,
          relationshipType: 'MANAGES',
        },
      });
      return !!manages;
    });
  }

  findFollow(followerPersonId: string, followingPersonId: string) {
    if (!this.followClient) return Promise.resolve(null);
    return this.followClient.findUnique({
      where: {
        followerPersonId_followingPersonId: { followerPersonId, followingPersonId },
      },
    });
  }

  createFollow(followerPersonId: string, followingPersonId: string) {
    if (!this.followClient) return Promise.resolve(null);
    return this.followClient.create({
      data: {
        id: newId(),
        followerPersonId,
        followingPersonId,
      },
      include: personFollowInclude,
    });
  }

  deleteFollow(followerPersonId: string, followingPersonId: string) {
    if (!this.followClient) return Promise.resolve(null);
    return this.followClient.delete({
      where: {
        followerPersonId_followingPersonId: { followerPersonId, followingPersonId },
      },
    });
  }

  listFollowers(personId: string, page: number, limit: number) {
    if (!this.followClient) {
      return Promise.resolve({ rows: [] as PersonFollowRow[], total: 0 });
    }
    const where = { followingPersonId: personId };
    const skip = (page - 1) * limit;
    return Promise.all([
      this.followClient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: personFollowInclude,
      }),
      this.followClient.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  listFollowing(personId: string, page: number, limit: number) {
    if (!this.followClient) {
      return Promise.resolve({ rows: [] as PersonFollowRow[], total: 0 });
    }
    const where = { followerPersonId: personId };
    const skip = (page - 1) * limit;
    return Promise.all([
      this.followClient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: personFollowInclude,
      }),
      this.followClient.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  countFollowers(personId: string) {
    if (!this.followClient) return Promise.resolve(0);
    return this.followClient.count({ where: { followingPersonId: personId } });
  }

  countFollowing(personId: string) {
    if (!this.followClient) return Promise.resolve(0);
    return this.followClient.count({ where: { followerPersonId: personId } });
  }

  upsertFollowsRelationship(followerPersonId: string, followingPersonId: string) {
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: followerPersonId,
            targetEntityType: 'Person',
            targetEntityId: followingPersonId,
            relationshipType: FOLLOWS_RELATIONSHIP,
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: followerPersonId,
        targetEntityType: 'Person',
        targetEntityId: followingPersonId,
        relationshipType: FOLLOWS_RELATIONSHIP,
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'person-follow' }),
      },
      update: {
        effectiveTo: null,
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'person-follow' }),
      },
    });
  }

  endFollowsRelationship(followerPersonId: string, followingPersonId: string) {
    return this.prisma.client.relationship.updateMany({
      where: {
        sourceEntityType: 'Person',
        sourceEntityId: followerPersonId,
        targetEntityType: 'Person',
        targetEntityId: followingPersonId,
        relationshipType: FOLLOWS_RELATIONSHIP,
        effectiveTo: null,
      },
      data: { effectiveTo: new Date() },
    });
  }

  findPerson(personId: string) {
    return this.prisma.client.person.findUnique({
      where: { id: personId },
      select: { id: true, displayName: true, name: true },
    });
  }
}
