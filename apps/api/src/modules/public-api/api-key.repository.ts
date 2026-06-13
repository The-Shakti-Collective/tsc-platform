import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { apiKeyListWhere, apiKeyPublicSelect } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type ApiKeyRow = {
  id: string;
  name: string;
  keyHash: string;
  prefix: string;
  scopes: string[];
  ownerOrgId: string | null;
  rateLimit: number;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
};

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('apiKey') != null;
  }

  list(input: { ownerOrgId?: string }) {
    const apiKey = this.client('apiKey') as {
      findMany: (args: unknown) => Promise<ApiKeyRow[]>;
    } | null;
    if (!apiKey) return Promise.resolve([]);
    return apiKey.findMany({
      where: apiKeyListWhere(input),
      select: apiKeyPublicSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    const apiKey = this.client('apiKey') as {
      findUnique: (args: unknown) => Promise<ApiKeyRow | null>;
    } | null;
    if (!apiKey) return Promise.resolve(null);
    return apiKey.findUnique({ where: { id }, select: apiKeyPublicSelect });
  }

  findByPrefix(prefix: string) {
    const apiKey = this.client('apiKey') as {
      findUnique: (args: unknown) => Promise<ApiKeyRow | null>;
    } | null;
    if (!apiKey) return Promise.resolve(null);
    return apiKey.findUnique({ where: { prefix } });
  }

  create(input: {
    name: string;
    keyHash: string;
    prefix: string;
    scopes: string[];
    ownerOrgId?: string | null;
    rateLimit: number;
  }) {
    const apiKey = this.client('apiKey') as {
      create: (args: unknown) => Promise<ApiKeyRow>;
    } | null;
    if (!apiKey) return Promise.resolve(null);
    return apiKey.create({
      data: {
        id: newId(),
        name: input.name,
        keyHash: input.keyHash,
        prefix: input.prefix,
        scopes: input.scopes,
        ownerOrgId: input.ownerOrgId ?? null,
        rateLimit: input.rateLimit,
        isActive: true,
      },
      select: apiKeyPublicSelect,
    });
  }

  deactivate(id: string) {
    const apiKey = this.client('apiKey') as {
      update: (args: unknown) => Promise<ApiKeyRow>;
    } | null;
    if (!apiKey) return Promise.resolve(null);
    return apiKey.update({
      where: { id },
      data: { isActive: false },
      select: apiKeyPublicSelect,
    });
  }

  touchLastUsed(id: string) {
    const apiKey = this.client('apiKey') as {
      update: (args: unknown) => Promise<unknown>;
    } | null;
    if (!apiKey) return Promise.resolve(null);
    return apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  countArtists(where: Prisma.ArtistWhereInput = {}) {
    return this.prisma.client.artist.count({ where });
  }

  countCommunities(where: Prisma.CommunityWhereInput = {}) {
    return this.prisma.client.community.count({ where });
  }

  countOpportunities(where: Prisma.OpportunityWhereInput = {}) {
    return this.prisma.client.opportunity.count({ where });
  }

  countEvents(where: Prisma.EventWhereInput = {}) {
    return this.prisma.client.event.count({ where });
  }

  countVenues(where: Prisma.VenueWhereInput = {}) {
    return this.prisma.client.venue.count({ where });
  }

  countIdentities() {
    const tscIdentity = this.client('tscIdentity') as {
      count: (args?: unknown) => Promise<number>;
    } | null;
    if (!tscIdentity) return Promise.resolve(0);
    return tscIdentity.count();
  }

  listArtists(input: {
    where: Prisma.ArtistWhereInput;
    skip: number;
    take: number;
  }) {
    return this.prisma.client.artist.findMany({
      where: input.where,
      include: {
        person: {
          select: {
            profile: { select: { city: true, genres: true, slug: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: input.skip,
      take: input.take,
    });
  }

  findArtistById(id: string) {
    return this.prisma.client.artist.findUnique({
      where: { id },
      include: {
        person: {
          select: {
            profile: { select: { city: true, genres: true, slug: true } },
          },
        },
      },
    });
  }

  listCommunities(input: { city?: string; skip: number; take: number }) {
    const where: Prisma.CommunityWhereInput = {};
    if (input.city?.trim()) {
      where.city = { equals: input.city.trim(), mode: 'insensitive' };
    }
    return this.prisma.client.community.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: input.skip,
      take: input.take,
    });
  }

  countCommunitiesFiltered(city?: string) {
    const where: Prisma.CommunityWhereInput = {};
    if (city?.trim()) where.city = { equals: city.trim(), mode: 'insensitive' };
    return this.prisma.client.community.count({ where });
  }

  listPublicOpportunities(input: {
    city?: string;
    category?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.OpportunityWhereInput = {
      marketplaceVisible: true,
      status: 'open',
    };
    if (input.city?.trim()) where.city = { equals: input.city.trim(), mode: 'insensitive' };
    if (input.category?.trim()) where.category = input.category.trim() as Prisma.OpportunityWhereInput['category'];

    return this.prisma.client.opportunity.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: input.skip,
      take: input.take,
    });
  }

  countPublicOpportunities(input: { city?: string; category?: string }) {
    const where: Prisma.OpportunityWhereInput = {
      marketplaceVisible: true,
      status: 'open',
    };
    if (input.city?.trim()) where.city = { equals: input.city.trim(), mode: 'insensitive' };
    if (input.category?.trim()) where.category = input.category.trim() as Prisma.OpportunityWhereInput['category'];
    return this.prisma.client.opportunity.count({ where });
  }

  listEvents(input: { city?: string; skip: number; take: number }) {
    const where: Prisma.EventWhereInput = {};
    if (input.city?.trim()) where.city = { equals: input.city.trim(), mode: 'insensitive' };
    return this.prisma.client.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      skip: input.skip,
      take: input.take,
    });
  }

  countEventsFiltered(city?: string) {
    const where: Prisma.EventWhereInput = {};
    if (city?.trim()) where.city = { equals: city.trim(), mode: 'insensitive' };
    return this.prisma.client.event.count({ where });
  }

  listVenuesWithEventCounts(input: { city?: string; skip: number; take: number }) {
    const where: Prisma.VenueWhereInput = {};
    if (input.city?.trim()) where.city = { equals: input.city.trim(), mode: 'insensitive' };
    return this.prisma.client.venue.findMany({
      where,
      include: { _count: { select: { events: true } } },
      orderBy: { name: 'asc' },
      skip: input.skip,
      take: input.take,
    });
  }

  countVenuesFiltered(city?: string) {
    const where: Prisma.VenueWhereInput = {};
    if (city?.trim()) where.city = { equals: city.trim(), mode: 'insensitive' };
    return this.prisma.client.venue.count({ where });
  }
}
