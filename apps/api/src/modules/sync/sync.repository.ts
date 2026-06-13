import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import type { SyncSourceSystemValue } from '@tsc/database';
import {
  normalizeCommunityMemberRole,
  normalizeRelationshipType,
  slugifyArtistName,
  syncEventReceiptUniqueWhere,
  syncMappingUniqueWhere,
} from '@tsc/database';
import type { SyncEventType } from '@tsc/contracts/sync';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import { applicationMetadataWithNotes } from '../opportunity/application-metadata';

@Injectable()
export class SyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEventReceipt(sourceSystem: SyncSourceSystemValue, externalId: string) {
    return this.prisma.client.syncEventReceipt.findUnique({
      where: syncEventReceiptUniqueWhere({ sourceSystem, externalId }),
    });
  }

  createEventReceipt(input: {
    sourceSystem: SyncSourceSystemValue;
    externalId: string;
    eventType: SyncEventType;
    status: 'processed' | 'duplicate' | 'failed';
    result?: Record<string, unknown>;
  }) {
    return this.prisma.client.syncEventReceipt.create({
      data: {
        id: newId(),
        sourceSystem: input.sourceSystem,
        externalId: input.externalId,
        eventType: input.eventType,
        status: input.status,
        result: toInputJson(input.result),
      },
    });
  }

  findMapping(input: {
    sourceSystem: SyncSourceSystemValue;
    externalId: string;
    tscEntityType: string;
  }) {
    return this.prisma.client.syncMapping.findUnique({
      where: syncMappingUniqueWhere(input),
    });
  }

  listMappingsForExternal(input: {
    sourceSystem: SyncSourceSystemValue;
    externalId: string;
  }) {
    return this.prisma.client.syncMapping.findMany({
      where: {
        sourceSystem: input.sourceSystem,
        externalId: input.externalId,
      },
    });
  }

  upsertMapping(input: {
    sourceSystem: SyncSourceSystemValue;
    externalId: string;
    tscEntityType: string;
    tscEntityId: string;
    eventType?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.syncMapping.upsert({
      where: syncMappingUniqueWhere({
        sourceSystem: input.sourceSystem,
        externalId: input.externalId,
        tscEntityType: input.tscEntityType,
      }),
      create: {
        id: newId(),
        sourceSystem: input.sourceSystem,
        externalId: input.externalId,
        tscEntityType: input.tscEntityType,
        tscEntityId: input.tscEntityId,
        eventType: input.eventType ?? null,
        metadata: toInputJson(input.metadata),
      },
      update: {
        tscEntityId: input.tscEntityId,
        eventType: input.eventType ?? undefined,
        metadata: input.metadata !== undefined ? toInputJson(input.metadata) : undefined,
      },
    });
  }

  resolveTscId(
    sourceSystem: SyncSourceSystemValue,
    externalId: string,
    tscEntityType: string,
  ) {
    return this.findMapping({ sourceSystem, externalId, tscEntityType });
  }

  createPerson(data: {
    displayName: string;
    email?: string | null;
    phone?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.person.create({
      data: {
        id: newId(),
        displayName: data.displayName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        metadata: toInputJson(data.metadata),
      },
    });
  }

  updatePerson(
    id: string,
    data: {
      displayName?: string;
      email?: string | null;
      phone?: string | null;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.prisma.client.person.update({
      where: { id },
      data: {
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        metadata: data.metadata !== undefined ? toInputJson(data.metadata) : undefined,
      },
    });
  }

  createArtist(data: {
    personId: string;
    name: string;
    slug: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.artist.create({
      data: {
        id: newId(),
        personId: data.personId,
        name: data.name,
        slug: data.slug,
        metadata: toInputJson(data.metadata),
      },
    });
  }

  findArtist(id: string) {
    return this.prisma.client.artist.findUnique({
      where: { id },
      select: { id: true, personId: true, name: true, slug: true },
    });
  }

  updateArtist(
    id: string,
    data: {
      name?: string;
      slug?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.prisma.client.artist.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        metadata: data.metadata !== undefined ? toInputJson(data.metadata) : undefined,
      },
    });
  }

  async createPassportStub(input: {
    artistId: string;
    slug: string;
    bio?: string | null;
    links?: Record<string, string> | Array<{ label: string; url: string }>;
  }) {
    const client = this.prisma.client as Prisma.TransactionClient & {
      artistPassport?: {
        upsert: (args: unknown) => Promise<{ id: string; slug: string }>;
      };
    };

    if (!client.artistPassport) {
      return null;
    }

    const links = normalizePassportLinks(input.links);

    return client.artistPassport.upsert({
      where: { artistId: input.artistId },
      create: {
        id: newId(),
        artistId: input.artistId,
        slug: input.slug,
        isPublic: false,
        bio: input.bio ?? null,
        links: toInputJson(links),
      },
      update: {
        bio: input.bio ?? undefined,
        links: input.links !== undefined ? toInputJson(links) : undefined,
      },
    });
  }

  createRelationship(input: {
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    relationshipType: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.relationship.create({
      data: {
        id: newId(),
        sourceEntityType: input.fromType as Prisma.RelationshipCreateInput['sourceEntityType'],
        sourceEntityId: input.fromId,
        targetEntityType: input.toType as Prisma.RelationshipCreateInput['targetEntityType'],
        targetEntityId: input.toId,
        relationshipType: normalizeRelationshipType(input.relationshipType),
        metadata: toInputJson(input.metadata),
      },
    });
  }

  findOpportunityById(id: string) {
    return this.prisma.client.opportunity.findUnique({ where: { id } });
  }

  createOpportunity(data: {
    title: string;
    source: string;
    artistId?: string | null;
    assignedToId?: string | null;
    value?: number | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.opportunity.create({
      data: {
        id: newId(),
        title: data.title,
        status: 'open',
        source: data.source,
        category: 'open_call',
        ownerType: data.artistId ? 'artist' : null,
        ownerId: data.artistId ?? null,
        value: data.value ?? null,
        metadata: toInputJson({
          ...(data.metadata ?? {}),
          assignedToId: data.assignedToId ?? null,
        }),
      },
    });
  }

  async upsertOpportunityApplication(input: {
    opportunityId: string;
    personId: string;
    artistId?: string | null;
    notes?: string | null;
    appliedAt?: Date;
    metadata?: Record<string, unknown>;
  }) {
    const existing = await this.prisma.client.opportunityApplication.findFirst({
      where: { opportunityId: input.opportunityId, personId: input.personId },
    });

    const metadata = applicationMetadataWithNotes(existing?.metadata ?? null, input.notes);

    if (existing) {
      return this.prisma.client.opportunityApplication.update({
        where: { id: existing.id },
        data: {
          artistId: input.artistId ?? undefined,
          status: 'applied',
          appliedAt: input.appliedAt ?? new Date(),
          metadata: toInputJson({
            source: 'coreknot_sync',
            ...(input.metadata ?? {}),
            ...(typeof metadata === 'object' && !Array.isArray(metadata)
              ? (metadata as Record<string, unknown>)
              : {}),
          }),
        },
      });
    }

    return this.prisma.client.opportunityApplication.create({
      data: {
        id: newId(),
        opportunityId: input.opportunityId,
        personId: input.personId,
        artistId: input.artistId ?? null,
        status: 'applied',
        appliedAt: input.appliedAt ?? new Date(),
        metadata: toInputJson({
          source: 'coreknot_sync',
          ...(input.metadata ?? {}),
          ...(typeof metadata === 'object' && !Array.isArray(metadata)
            ? (metadata as Record<string, unknown>)
            : {}),
        }),
      },
    });
  }

  createOpportunityActivity(input: {
    opportunityId: string;
    type: string;
    summary?: string;
    actorId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.opportunityActivity.create({
      data: {
        id: newId(),
        opportunityId: input.opportunityId,
        type: input.type,
        summary: input.summary ?? null,
        personId: input.actorId ?? null,
        metadata: toInputJson(input.metadata),
      },
    });
  }

  findCommunity(id: string) {
    return this.prisma.client.community.findUnique({ where: { id } });
  }

  ensureCommunityMember(communityId: string, personId: string, role?: string) {
    const normalizedRole = normalizeCommunityMemberRole(
      role === 'Leader' || role === 'leader' ? 'Founder' : (role ?? 'Member'),
    );
    return this.prisma.client.communityMember.upsert({
      where: { communityId_personId: { communityId, personId } },
      create: {
        id: newId(),
        communityId,
        personId,
        role: normalizedRole,
        status: 'active',
        joinedAt: new Date(),
      },
      update: {
        role: normalizedRole,
        status: 'active',
        leftAt: null,
      },
    });
  }

  async createBrand(data: {
    name: string;
    industry?: string | null;
    city?: string | null;
    country?: string | null;
    website?: string | null;
    personId?: string | null;
  }) {
    const client = this.prisma.client as Prisma.TransactionClient & {
      brand?: {
        create: (args: unknown) => Promise<{ id: string; name: string }>;
      };
    };

    if (!client.brand) {
      return null;
    }

    return client.brand.create({
      data: {
        id: newId(),
        name: data.name,
        industry: data.industry ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
        website: data.website ?? null,
        personId: data.personId ?? null,
      },
    });
  }

  slugify(name: string): string {
    return slugifyArtistName(name);
  }
}

function normalizePassportLinks(
  links?: Record<string, string> | Array<{ label: string; url: string }>,
): Array<{ label: string; url: string }> {
  if (!links) return [];
  if (Array.isArray(links)) return links;
  return Object.entries(links).map(([label, url]) => ({ label, url }));
}
