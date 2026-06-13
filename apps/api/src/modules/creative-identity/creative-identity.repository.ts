import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  creativeIdentityInclude,
  creativeIdentitySlugWhere,
  filterCreativeRoleTags,
  filterCreativeVerticals,
  slugifyCreativeHandle,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { CreativeIdentityPatchInput } from './dto';

type CreativeIdentityClient = {
  findFirst: (args: unknown) => Promise<CreativeIdentityRow | null>;
  findUnique: (args: unknown) => Promise<CreativeIdentityRow | null>;
  create: (args: unknown) => Promise<CreativeIdentityRow>;
  update: (args: unknown) => Promise<CreativeIdentityRow>;
};

type PersonRoleClient = {
  findMany: (args: unknown) => Promise<PersonRoleRow[]>;
  findFirst: (args: unknown) => Promise<PersonRoleRow | null>;
  create: (args: unknown) => Promise<PersonRoleRow>;
  update: (args: unknown) => Promise<PersonRoleRow>;
};

type PersonProfileClient = {
  findUnique: (args: unknown) => Promise<PersonProfileSeed | null>;
};

export type CreativeIdentityRow = {
  id: string;
  personId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  primaryCity: string | null;
  verticals: string[];
  roles: string[];
  capabilities: string[];
  isPublic: boolean;
  verificationLevel: number;
  trustScoreStub: number | null;
  ecosystemScoreStub: number | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: string;
    name: string | null;
    displayName: string | null;
    profile?: {
      slug: string;
      username: string | null;
      bio: string | null;
      city: string | null;
      verificationLevel: number;
      ecosystemScore: number | null;
      reputationScore: number | null;
    } | null;
  };
};

export type PersonRoleRow = {
  id: string;
  personId: string;
  role: string;
  status: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Prisma.JsonValue;
  assignedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PersonProfileSeed = {
  personId: string;
  slug: string;
  bio: string | null;
  city: string | null;
  verificationLevel: number;
  ecosystemScore: number | null;
  reputationScore: number | null;
  person?: {
    displayName: string | null;
    name: string | null;
  };
};

@Injectable()
export class CreativeIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  isAvailable(): boolean {
    return !!this.client;
  }

  private get client(): CreativeIdentityClient | null {
    const prisma = this.prisma.client as Prisma.TransactionClient & {
      creativeIdentity?: CreativeIdentityClient;
    };
    return prisma.creativeIdentity ?? null;
  }

  private get roleClient(): PersonRoleClient | null {
    const prisma = this.prisma.client as Prisma.TransactionClient & {
      personRole?: PersonRoleClient;
    };
    return prisma.personRole ?? null;
  }

  private get profileClient(): PersonProfileClient | null {
    const prisma = this.prisma.client as Prisma.TransactionClient & {
      personProfile?: PersonProfileClient;
    };
    return prisma.personProfile ?? null;
  }

  findBySlug(slug: string) {
    if (!this.client) return Promise.resolve(null);
    return this.client.findFirst({
      where: creativeIdentitySlugWhere(slug),
      include: creativeIdentityInclude,
    });
  }

  findBySlugIncludingPrivate(slug: string) {
    if (!this.client) return Promise.resolve(null);
    return this.client.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' } },
      include: creativeIdentityInclude,
    });
  }

  findByPersonId(personId: string) {
    if (!this.client) return Promise.resolve(null);
    return this.client.findUnique({
      where: { personId },
      include: creativeIdentityInclude,
    });
  }

  async createFromProfileSeed(input: {
    personId: string;
    slug?: string | null;
    displayName?: string | null;
  }): Promise<{ row: CreativeIdentityRow; created: boolean } | null> {
    if (!this.client) return null;

    const existing = await this.findByPersonId(input.personId);
    if (existing) return { row: existing, created: false };

    const profile = this.profileClient
      ? await this.profileClient.findUnique({
          where: { personId: input.personId },
          include: {
            person: { select: { displayName: true, name: true } },
          },
        })
      : null;

    const baseSlug =
      input.slug ??
      profile?.slug ??
      (slugifyCreativeHandle(input.displayName ?? input.personId) ||
        `creator-${input.personId.slice(0, 8)}`);

    let slug = baseSlug;
    let suffix = 0;
    while (await this.findBySlugIncludingPrivate(slug)) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const displayName =
      input.displayName?.trim() ||
      profile?.person?.displayName?.trim() ||
      profile?.person?.name?.trim() ||
      slug;

    const row = await this.client.create({
      data: {
        id: newId(),
        personId: input.personId,
        slug,
        displayName,
        bio: profile?.bio ?? null,
        primaryCity: profile?.city ?? null,
        verificationLevel: profile?.verificationLevel ?? 0,
        ecosystemScoreStub: profile?.ecosystemScore ?? null,
        trustScoreStub: profile?.reputationScore ?? null,
        verticals: [],
        roles: [],
        capabilities: [],
        metadata: toInputJson({ source: 'profile_migration' }),
      },
      include: creativeIdentityInclude,
    });

    return { row, created: true };
  }

  updateByPersonId(personId: string, input: CreativeIdentityPatchInput) {
    if (!this.client) {
      throw new Error('CreativeIdentity model unavailable');
    }

    const data: Record<string, unknown> = {};
    if (input.headline !== undefined) data.headline = input.headline;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    if (input.primaryCity !== undefined) data.primaryCity = input.primaryCity;
    if (input.verticals !== undefined) {
      data.verticals = filterCreativeVerticals(input.verticals);
    }
    if (input.roles !== undefined) {
      data.roles = filterCreativeRoleTags(input.roles);
    }
    if (input.capabilities !== undefined) data.capabilities = input.capabilities;
    if (input.isPublic !== undefined) data.isPublic = input.isPublic;

    return this.client.update({
      where: { personId },
      data,
      include: creativeIdentityInclude,
    });
  }

  appendRoleTag(personId: string, roleTag: string) {
    if (!this.client) return Promise.resolve(null);
    return this.findByPersonId(personId).then(async (row) => {
      if (!row) return null;
      const tags = filterCreativeRoleTags([...row.roles, roleTag]);
      if (tags.length === row.roles.length) return row;
      return this.client!.update({
        where: { personId },
        data: { roles: tags },
        include: creativeIdentityInclude,
      });
    });
  }

  listActiveRoles(personId: string) {
    if (!this.roleClient) return Promise.resolve([]);
    return this.roleClient.findMany({
      where: { personId, status: 'active' },
      orderBy: { assignedAt: 'desc' },
    });
  }

  findRoleById(roleId: string, personId: string) {
    if (!this.roleClient) return Promise.resolve(null);
    return this.roleClient.findFirst({
      where: { id: roleId, personId },
    });
  }

  createRole(input: {
    personId: string;
    role: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    if (!this.roleClient) {
      throw new Error('PersonRole model unavailable');
    }

    return this.roleClient.create({
      data: {
        id: newId(),
        personId: input.personId,
        role: input.role,
        status: 'active',
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? toInputJson(input.metadata) : undefined,
      },
    });
  }

  deactivateRole(roleId: string, _personId: string) {
    if (!this.roleClient) {
      throw new Error('PersonRole model unavailable');
    }

    return this.roleClient.update({
      where: { id: roleId },
      data: { status: 'inactive' },
    });
  }

  findPersonByCoreKnotUser(userId: string) {
    return this.prisma.client.personIdentifier.findFirst({
      where: {
        provider: 'coreknot_user',
        externalId: userId,
        person: { mergedIntoId: null },
      },
      select: { personId: true },
    });
  }

  findPersonIdByArtistMembership(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { personId: true },
    });
  }
}
