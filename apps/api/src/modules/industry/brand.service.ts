import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  BrandApplicationReviewPayload,
  BrandApplicationsPayload,
  BrandCampaignsPayload,
  BrandDetail,
  BrandListPayload,
  BrandOpportunitiesPayload,
  BrandOpportunityCreatedPayload,
  BrandSummary,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import type {
  BrandCreateInput,
  BrandCreateOpportunityInput,
  BrandListQuery,
  BrandUpdateInput,
} from './dto';
import type {
  BrandApplicationReviewInput,
  BrandApplicationsQuery,
} from '../opportunity/dto';
import { DealService } from '../deal/deal.service';
import { OpportunityService } from '../opportunity/opportunity.service';
import { BrandRepository } from './brand.repository';
import { BrandSyncEmitter } from './brand-sync.emitter';
import { TscIdentityProvisionService } from '../tsc-identity/tsc-identity-provision.service';

@Injectable()
export class BrandService {
  constructor(
    private readonly repository: BrandRepository,
    private readonly activityService: ActivityService,
    private readonly syncEmitter: BrandSyncEmitter,
    private readonly opportunityService: OpportunityService,
    private readonly dealService: DealService,
    private readonly tscIdentityProvision: TscIdentityProvisionService,
  ) {}

  async list(query: BrandListQuery): Promise<BrandListPayload> {
    this.assertAvailable();
    const rows = await this.repository.list(query);
    const counts = await Promise.all(
      rows.map((row) => this.repository.countBrandOpportunities(row.id)),
    );
    return {
      items: rows.map((row, index) => this.toSummary(row, counts[index] ?? 0)),
      filters: {
        industry: query.industry ?? null,
        city: query.city ?? null,
        status: query.status ?? null,
        verified: query.verified ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDetail(id: string): Promise<BrandDetail> {
    this.assertAvailable();
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Brand ${id} not found`);
    const opportunityCount = await this.repository.countBrandOpportunities(id);
    return {
      ...this.toSummary(row, opportunityCount),
      campaignCount: 0,
    };
  }

  async create(input: BrandCreateInput, ctx: MembershipContext): Promise<BrandSummary> {
    this.assertAvailable();
    const personId = ctx.personId ?? null;
    const row = await this.repository.create(input, personId);
    if (!row) throw new ServiceUnavailableException('Brand persistence failed');

    if (personId) {
      await this.activityService.record({
        actorPersonId: personId,
        action: 'created_brand',
        targetType: 'Brand',
        targetId: row.id,
        metadata: { brandName: row.name, industry: row.industry },
      });
    }

    this.syncEmitter.emit({
      type: 'brand.created',
      externalId: row.id,
      entityType: 'Brand',
      data: {
        brandId: row.id,
        name: row.name,
        industry: row.industry,
        city: row.city,
        personId: row.personId,
      },
    });

    void this.tscIdentityProvision.ensureBrandIdentity(row.id, row.name, true);

    return this.toSummary(row, 0);
  }

  async update(
    id: string,
    input: BrandUpdateInput,
    ctx: MembershipContext,
  ): Promise<BrandDetail> {
    this.assertAvailable();
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Brand ${id} not found`);
    this.assertCanManage(existing.personId, ctx);

    const row = await this.repository.update(id, input);
    if (!row) throw new ServiceUnavailableException('Brand update failed');
    return this.getDetail(id);
  }

  async listCampaigns(id: string): Promise<BrandCampaignsPayload> {
    await this.getDetail(id);
    return {
      brandId: id,
      items: [],
      stubbed: true,
      message: 'Campaign pipeline deferred to Phase 7 Month 3',
      updatedAt: new Date().toISOString(),
    };
  }

  async listApplications(
    id: string,
    query: BrandApplicationsQuery,
    ctx: MembershipContext,
  ): Promise<BrandApplicationsPayload> {
    const brand = await this.getDetail(id);
    return this.opportunityService.listBrandApplications(
      id,
      query,
      ctx,
      brand.personId,
    );
  }

  async reviewApplication(
    id: string,
    applicationId: string,
    input: BrandApplicationReviewInput,
    ctx: MembershipContext,
  ): Promise<BrandApplicationReviewPayload> {
    const brand = await this.getDetail(id);
    const result = await this.opportunityService.reviewBrandApplication(
      id,
      applicationId,
      input,
      ctx,
      brand.personId,
    );

    if (input.action === 'hire') {
      await this.dealService.createFromHiredApplication(applicationId, ctx.personId);
    }

    return result;
  }

  async listOpportunities(id: string): Promise<BrandOpportunitiesPayload> {
    await this.getDetail(id);
    const rows = await this.repository.listBrandOpportunities(id);
    return {
      brandId: id,
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        listingType: row.listingType ?? null,
        category: row.category ?? null,
        city: row.city ?? null,
        genre: row.genre ?? null,
        deadline: row.deadline?.toISOString() ?? null,
        status: row.status,
        value: row.value != null ? Number(row.value) : null,
        budget:
          row.budget != null
            ? Number(row.budget)
            : row.value != null
              ? Number(row.value)
              : null,
        applicationCount: row._count?.applications ?? 0,
        updatedAt: row.updatedAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async createOpportunity(
    id: string,
    input: BrandCreateOpportunityInput,
    ctx: MembershipContext,
  ): Promise<BrandOpportunityCreatedPayload> {
    const brand = await this.getDetail(id);
    this.assertCanManage(brand.personId, ctx);

    const opportunity = await this.repository.createBrandOpportunity(
      id,
      input,
      ctx.userId,
    );
    if (!opportunity) {
      throw new ServiceUnavailableException('Opportunity model not ready for brand posts');
    }

    if (ctx.personId) {
      await this.activityService.record({
        actorPersonId: ctx.personId,
        action: 'launched_opportunity',
        targetType: 'Opportunity',
        targetId: opportunity.id,
        metadata: {
          brandId: id,
          brandName: brand.name,
          opportunityTitle: opportunity.title,
        },
      });
    }

    return {
      id: opportunity.id,
      brandId: id,
      title: opportunity.title,
      status: opportunity.status,
      category: opportunity.category ?? null,
      createdAt: opportunity.createdAt.toISOString(),
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Brand model not migrated yet');
    }
  }

  private assertCanManage(ownerPersonId: string | null, ctx: MembershipContext) {
    if (ctx.roles.includes('admin')) return;
    if (ownerPersonId && ctx.personId === ownerPersonId) return;
    throw new ForbiddenException('Brand management access required');
  }

  private toSummary(
    row: {
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
  },
    opportunityCount?: number,
  ): BrandSummary {
    const ownerName =
      row.owner?.displayName?.trim() ||
      row.owner?.name?.trim() ||
      null;
    return {
      id: row.id,
      name: row.name,
      industry: row.industry,
      website: row.website,
      city: row.city,
      country: row.country,
      logo: row.logo,
      description: row.description,
      budgetRange: row.budgetRange as BrandSummary['budgetRange'],
      categories: row.categories ?? [],
      verified: row.verified,
      status: row.status as BrandSummary['status'],
      trustScore: row.trustScore,
      personId: row.personId,
      ownerName,
      ownerSlug: row.owner?.profile?.slug ?? row.owner?.profile?.username ?? null,
      opportunityCount: opportunityCount ?? row._count?.opportunities ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
