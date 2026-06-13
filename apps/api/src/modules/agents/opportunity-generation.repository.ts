import { Injectable } from '@nestjs/common';
import type { MarketplaceListingTypeValue } from '@tsc/database';
import type { Prisma } from '@tsc/database';
import {
  generatedOpportunityInclude,
  type GeneratedOpportunityStatusValue,
  type GeneratedOpportunityTypeValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';

type GeneratedOpportunityRow = {
  id: string;
  source: string;
  generationReason: string;
  signalSnapshot: Prisma.JsonValue;
  suggestedType: string;
  title: string;
  description: string | null;
  city: string | null;
  genre: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  confidence: number;
  status: string;
  opportunityId: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  opportunity?: {
    id: string;
    title: string;
    status: string;
    marketplaceVisible: boolean;
    city: string | null;
    category: string;
    listingType: string | null;
  } | null;
};

type GenerationRunRow = {
  id: string;
  triggeredBy: string;
  scope: Prisma.JsonValue;
  signals: Prisma.JsonValue;
  generatedCount: number;
  runAt: Date;
};

@Injectable()
export class OpportunityGenerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get draftClient() {
    return (this.prisma.client as unknown as {
      generatedOpportunity?: {
        create: (args: unknown) => Promise<GeneratedOpportunityRow>;
        findMany: (args: unknown) => Promise<GeneratedOpportunityRow[]>;
        findUnique: (args: unknown) => Promise<GeneratedOpportunityRow | null>;
        update: (args: unknown) => Promise<GeneratedOpportunityRow>;
        count: (args: unknown) => Promise<number>;
      };
    }).generatedOpportunity ?? null;
  }

  private get runClient() {
    return (this.prisma.client as unknown as {
      opportunityGenerationRun?: {
        create: (args: unknown) => Promise<GenerationRunRow>;
        findMany: (args: unknown) => Promise<GenerationRunRow[]>;
      };
    }).opportunityGenerationRun ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.draftClient && this.runClient);
  }

  createDraft(input: {
    source?: string;
    generationReason: string;
    signalSnapshot: Record<string, unknown>;
    suggestedType: GeneratedOpportunityTypeValue;
    title: string;
    description?: string | null;
    city?: string | null;
    genre?: string | null;
    targetEntityType?: string | null;
    targetEntityId?: string | null;
    confidence: number;
    status?: GeneratedOpportunityStatusValue;
  }) {
    if (!this.draftClient) return Promise.resolve(null);
    return this.draftClient.create({
      data: {
        source: input.source ?? 'system',
        generationReason: input.generationReason,
        signalSnapshot: toInputJson(input.signalSnapshot),
        suggestedType: input.suggestedType,
        title: input.title,
        description: input.description ?? null,
        city: input.city ?? null,
        genre: input.genre ?? null,
        targetEntityType: input.targetEntityType ?? null,
        targetEntityId: input.targetEntityId ?? null,
        confidence: input.confidence,
        status: input.status ?? 'pending_approval',
      },
      include: generatedOpportunityInclude,
    });
  }

  listDrafts(query: {
    status?: GeneratedOpportunityStatusValue;
    limit?: number;
    city?: string;
    genre?: string;
  }) {
    if (!this.draftClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.genre) where.genre = { equals: query.genre, mode: 'insensitive' };

    return this.draftClient.findMany({
      where,
      include: generatedOpportunityInclude,
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
      take: query.limit ?? 30,
    });
  }

  countDrafts(status?: GeneratedOpportunityStatusValue) {
    if (!this.draftClient) return Promise.resolve(0);
    return this.draftClient.count({
      where: status ? { status } : undefined,
    });
  }

  findDraft(id: string) {
    if (!this.draftClient) return Promise.resolve(null);
    return this.draftClient.findUnique({
      where: { id },
      include: generatedOpportunityInclude,
    });
  }

  updateDraft(
    id: string,
    data: {
      status?: GeneratedOpportunityStatusValue;
      opportunityId?: string | null;
      approvedAt?: Date | null;
      approvedBy?: string | null;
    },
  ) {
    if (!this.draftClient) return Promise.resolve(null);
    return this.draftClient.update({
      where: { id },
      data,
      include: generatedOpportunityInclude,
    });
  }

  listPublished(limit = 30) {
    if (!this.draftClient) return Promise.resolve([]);
    return this.draftClient.findMany({
      where: { status: 'published', opportunityId: { not: null } },
      include: generatedOpportunityInclude,
      orderBy: [{ approvedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  createRun(input: {
    triggeredBy: string;
    scope: Record<string, unknown>;
    signals: Record<string, unknown>;
    generatedCount: number;
  }) {
    if (!this.runClient) return Promise.resolve(null);
    return this.runClient.create({
      data: {
        triggeredBy: input.triggeredBy,
        scope: toInputJson(input.scope),
        signals: toInputJson(input.signals),
        generatedCount: input.generatedCount,
      },
    });
  }

  listRecentRuns(limit = 10) {
    if (!this.runClient) return Promise.resolve([]);
    return this.runClient.findMany({
      orderBy: [{ runAt: 'desc' }],
      take: limit,
    });
  }

  listBrandFundStubs(limit = 10) {
    return this.prisma.client.brand.findMany({
      where: {
        status: 'active',
        budgetRange: { in: ['five_to_25l', 'twenty_five_to_1cr', 'over_1cr'] },
      },
      select: {
        id: true,
        name: true,
        budgetRange: true,
        trustScore: true,
      },
      orderBy: [{ trustScore: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  }

  countArtistsInCityGenre(city: string, genre: string) {
    return this.prisma.client.artist.count({
      where: {
        communities: {
          some: {
            city: { equals: city, mode: 'insensitive' },
            genres: { has: genre.toLowerCase() },
          },
        },
      },
    });
  }

  createMarketplaceOpportunity(input: {
    title: string;
    description?: string | null;
    category: string;
    listingType: string;
    city?: string | null;
    genre?: string | null;
    brandId?: string | null;
    value?: number | null;
    deadline?: Date | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.opportunity.create({
      data: {
        id: newId(),
        title: input.title,
        category: input.category as never,
        listingType: input.listingType as MarketplaceListingTypeValue,
        city: input.city ?? null,
        status: 'open',
        source: 'system_generated',
        marketplaceVisible: true,
        brandId: input.brandId ?? null,
        value: input.value ?? null,
        deadline: input.deadline ?? null,
        metadata: toInputJson({
          ...(input.metadata ?? {}),
          genre: input.genre ?? null,
          createdVia: 'opportunity_generation_engine',
        }),
      },
    });
  }

  createOpportunityActivity(input: {
    opportunityId: string;
    type: string;
    summary?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.opportunityActivity.create({
      data: {
        id: newId(),
        opportunityId: input.opportunityId,
        type: input.type,
        summary: input.summary ?? null,
        metadata: toInputJson(input.metadata),
      },
    });
  }
}
