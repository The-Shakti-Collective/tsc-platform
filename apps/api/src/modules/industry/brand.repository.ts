import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { brandInclude, brandListWhere, LISTING_TYPE_TO_CATEGORY } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { BrandCreateInput, BrandCreateOpportunityInput, BrandListQuery, BrandUpdateInput } from './dto';

type BrandRow = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  logo: string | null;
  description: string | null;
  budgetRange: string | null;
  categories: string[];
  verified: boolean;
  status: string;
  trustScore: number | null;
  personId: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    displayName: string | null;
    name: string | null;
    profile?: { slug: string; username: string | null } | null;
  } | null;
  _count?: { opportunities: number };
};

type BrandClient = {
  findMany: (args: unknown) => Promise<BrandRow[]>;
  findUnique: (args: unknown) => Promise<BrandRow | null>;
  create: (args: unknown) => Promise<BrandRow>;
  update: (args: unknown) => Promise<BrandRow>;
};

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get brandClient(): BrandClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & { brand?: BrandClient };
    return client.brand ?? null;
  }

  isAvailable(): boolean {
    return this.brandClient != null;
  }

  list(query: BrandListQuery) {
    if (!this.brandClient) return Promise.resolve([]);
    return this.brandClient.findMany({
      where: brandListWhere({
        industry: query.industry,
        city: query.city,
        status: query.status,
        verified: query.verified,
      }),
      include: brandInclude,
      orderBy: [{ verified: 'desc' }, { updatedAt: 'desc' }],
      take: query.limit,
    });
  }

  findById(id: string) {
    if (!this.brandClient) return Promise.resolve(null);
    return this.brandClient.findUnique({ where: { id }, include: brandInclude });
  }

  create(input: BrandCreateInput, personId?: string | null) {
    if (!this.brandClient) return Promise.resolve(null);
    return this.brandClient.create({
      data: {
        id: newId(),
        name: input.name,
        industry: input.industry ?? null,
        website: input.website || null,
        city: input.city ?? null,
        country: input.country ?? null,
        logo: input.logo || null,
        description: input.description ?? null,
        budgetRange: input.budgetRange ?? null,
        categories: input.categories ?? [],
        verified: input.verified ?? false,
        status: input.status ?? 'active',
        trustScore: null,
        personId: input.personId ?? personId ?? null,
      },
      include: brandInclude,
    });
  }

  update(id: string, input: BrandUpdateInput) {
    if (!this.brandClient) return Promise.resolve(null);
    return this.brandClient.update({
      where: { id },
      data: {
        name: input.name,
        industry: input.industry,
        website: input.website === '' ? null : input.website,
        city: input.city,
        country: input.country,
        logo: input.logo === '' ? null : input.logo,
        description: input.description,
        budgetRange: input.budgetRange,
        categories: input.categories,
        verified: input.verified,
        status: input.status,
        personId: input.personId,
      },
      include: brandInclude,
    });
  }

  countBrandOpportunities(brandId: string) {
    const client = this.prisma.client as { opportunity?: { count: (args: unknown) => Promise<number> } };
    if (!client.opportunity) return Promise.resolve(0);
    return client.opportunity.count({ where: { brandId } }).catch(() => 0);
  }

  listBrandOpportunities(brandId: string) {
    const client = this.prisma.client as {
      opportunity?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            title: string;
            listingType?: string | null;
            category?: string | null;
            city?: string | null;
            genre?: string | null;
            deadline?: Date | null;
            status: string;
            value: unknown;
            budget?: unknown;
            updatedAt: Date;
            _count?: { applications: number };
          }>
        >;
      };
    };
    if (!client.opportunity) return Promise.resolve([]);
    return client.opportunity.findMany({
      where: { brandId },
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  createBrandOpportunity(
    brandId: string,
    input: BrandCreateOpportunityInput,
    actorId?: string | null,
  ) {
    const client = this.prisma.client as {
      opportunity?: { create: (args: unknown) => Promise<{
        id: string;
        title: string;
        status: string;
        category?: string | null;
        createdAt: Date;
      }> };
    };
    if (!client.opportunity) {
      return Promise.resolve(null);
    }
    const listingType = input.listingType ?? 'brand_campaign';
    const category =
      input.category ?? LISTING_TYPE_TO_CATEGORY[listingType] ?? 'brand_deal';
    const budget = input.budget ?? input.value ?? null;

    return client.opportunity.create({
      data: {
        id: newId(),
        title: input.title,
        description: input.description ?? null,
        status: 'open',
        source: 'brand',
        listingType,
        ownerType: 'brand',
        ownerId: brandId,
        category,
        city: input.city ?? null,
        genre: input.genre ?? null,
        requirements: input.requirements ?? [],
        value: input.value ?? budget,
        budget,
        deadline: input.deadline ? new Date(input.deadline) : null,
        marketplaceVisible: input.marketplaceVisible ?? true,
        brandId,
        assignedToId: actorId ?? null,
        metadata: toInputJson({
          brandId,
          createdVia: 'brand-os',
          listingType,
        }),
      },
    });
  }
}
