import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  buildTscCanonicalUrl,
  entityTypeForNamespace,
  namespaceForEntityType,
  slugifyTscIdentity,
  type TscIdentityEntityTypeValue,
  type TscIdentityNamespaceValue,
  type TscVerificationBadgeValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

export type TscIdentityRow = {
  id: string;
  entityType: TscIdentityEntityTypeValue;
  entityId: string;
  namespace: TscIdentityNamespaceValue;
  slug: string;
  canonicalUrl: string;
  isPublic: boolean;
  verifiedBadge: TscVerificationBadgeValue | null;
  verifiedAt: Date | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type TscIdentityClient = {
  findFirst: (args: unknown) => Promise<TscIdentityRow | null>;
  findMany: (args: unknown) => Promise<TscIdentityRow[]>;
  upsert: (args: unknown) => Promise<TscIdentityRow>;
  update: (args: unknown) => Promise<TscIdentityRow>;
};

@Injectable()
export class TscIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client(): TscIdentityClient | null {
    const db = this.prisma.client as Prisma.TransactionClient & {
      tscIdentity?: TscIdentityClient;
    };
    return db.tscIdentity ?? null;
  }

  isAvailable(): boolean {
    return this.client != null;
  }

  findByNamespaceSlug(namespace: TscIdentityNamespaceValue, slug: string) {
    if (!this.client) return Promise.resolve(null);
    return this.client.findFirst({
      where: { namespace, slug },
    });
  }

  findPublicByNamespaceSlug(namespace: TscIdentityNamespaceValue, slug: string) {
    if (!this.client) return Promise.resolve(null);
    return this.client.findFirst({
      where: { namespace, slug, isPublic: true },
    });
  }

  findByEntity(namespace: TscIdentityNamespaceValue, entityId: string) {
    if (!this.client) return Promise.resolve(null);
    return this.client.findFirst({
      where: {
        namespace,
        entityId,
        entityType: entityTypeForNamespace(namespace),
      },
    });
  }

  listByEntity(entityType: TscIdentityEntityTypeValue, entityId: string) {
    if (!this.client) return Promise.resolve([]);
    return this.client.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  listByEntityIds(entityType: TscIdentityEntityTypeValue, entityIds: string[]) {
    if (!this.client || entityIds.length === 0) return Promise.resolve([]);
    return this.client.findMany({
      where: { entityType, entityId: { in: entityIds } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async ensureIdentity(input: {
    entityType: TscIdentityEntityTypeValue;
    entityId: string;
    slug: string;
    isPublic?: boolean;
  }): Promise<TscIdentityRow | null> {
    if (!this.client) return null;

    const namespace = namespaceForEntityType(input.entityType);
    const slug = slugifyTscIdentity(input.slug) || `entity-${input.entityId.slice(0, 8)}`;
    const canonicalUrl = buildTscCanonicalUrl(namespace, slug);

    return this.client.upsert({
      where: {
        entityType_entityId_namespace: {
          entityType: input.entityType,
          entityId: input.entityId,
          namespace,
        },
      },
      create: {
        id: newId(),
        entityType: input.entityType,
        entityId: input.entityId,
        namespace,
        slug,
        canonicalUrl,
        isPublic: input.isPublic ?? true,
      },
      update: {
        slug,
        canonicalUrl,
        isPublic: input.isPublic ?? undefined,
      },
    });
  }

  setVerifiedBadge(
    entityType: TscIdentityEntityTypeValue,
    entityId: string,
    badge: TscVerificationBadgeValue | null,
    isPublic?: boolean,
  ) {
    if (!this.client) return Promise.resolve(null);

    const namespace = namespaceForEntityType(entityType);

    return this.client.update({
      where: {
        entityType_entityId_namespace: {
          entityType,
          entityId,
          namespace,
        },
      },
      data: {
        verifiedBadge: badge,
        verifiedAt: badge ? new Date() : null,
        isPublic: isPublic ?? undefined,
      },
    }).catch(() => null);
  }

  findPersonProfile(personId: string) {
    return this.prisma.client.personProfile.findUnique({
      where: { personId },
      select: {
        slug: true,
        personId: true,
        verificationLevel: true,
        adminVerified: true,
      },
    });
  }

  findArtistByPersonId(personId: string) {
    return this.prisma.client.artist.findFirst({
      where: { personId },
      select: { id: true, slug: true, displayName: true, name: true },
    });
  }

  findArtistById(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, slug: true, displayName: true, name: true, personId: true },
    });
  }

  findCommunityById(communityId: string) {
    return this.prisma.client.community.findUnique({
      where: { id: communityId },
      select: { id: true, slug: true, name: true },
    });
  }

  findBrandById(brandId: string) {
    const client = this.prisma.client as Prisma.TransactionClient & {
      brand?: {
        findUnique: (args: unknown) => Promise<{
          id: string;
          name: string;
          verified: boolean;
          personId: string | null;
        } | null>;
      };
    };
    if (!client.brand) return Promise.resolve(null);
    return client.brand.findUnique({
      where: { id: brandId },
      select: { id: true, name: true, verified: true, personId: true },
    });
  }

  findVenueById(venueId: string) {
    return this.prisma.client.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true, city: true },
    });
  }

  listBrandsForPerson(personId: string) {
    const client = this.prisma.client as Prisma.TransactionClient & {
      brand?: {
        findMany: (args: unknown) => Promise<Array<{ id: string; name: string; verified: boolean }>>;
      };
    };
    if (!client.brand) return Promise.resolve([]);
    return client.brand.findMany({
      where: { personId },
      select: { id: true, name: true, verified: true },
    });
  }

  listCommunityLeadership(personId: string) {
    return this.prisma.client.communityMember.findMany({
      where: {
        personId,
        role: { in: ['Founder', 'Moderator'] },
        status: 'active',
      },
      include: { community: { select: { id: true, slug: true, name: true } } },
    });
  }

  findArtistBySlug(slug: string) {
    return this.prisma.client.artist.findFirst({
      where: { slug },
      select: { id: true, slug: true, displayName: true, name: true, personId: true },
    });
  }

  findProfileBySlug(slug: string) {
    return this.prisma.client.personProfile.findFirst({
      where: { slug },
      select: { personId: true, slug: true, verificationLevel: true, adminVerified: true },
    });
  }

  findCommunityBySlug(slug: string) {
    return this.prisma.client.community.findFirst({
      where: { slug },
      select: { id: true, slug: true, name: true },
    });
  }

  updateBrandVerified(brandId: string, verified: boolean) {
    const client = this.prisma.client as Prisma.TransactionClient & {
      brand?: { update: (args: unknown) => Promise<unknown> };
    };
    if (!client.brand) return Promise.resolve(null);
    return client.brand.update({
      where: { id: brandId },
      data: { verified },
    }).catch(() => null);
  }

  updatePersonAdminVerified(personId: string) {
    return this.prisma.client.personProfile
      .update({
        where: { personId },
        data: { adminVerified: true, verificationLevel: 4 },
      })
      .catch(() => null);
  }
}
