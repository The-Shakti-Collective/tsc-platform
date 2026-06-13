import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { resolveListingType } from '@tsc/database';
import type {
  BrandApplicationReviewAction,
  BrandApplicationReviewPayload,
  BrandApplicationSummary,
  BrandApplicationsPayload,
  MarketplaceBrowsePayload,
  MarketplaceListingDetail,
  MarketplaceListingSummary,
  MarketplaceListingsPayload,
  MarketplaceOpportunityDetail,
  MarketplaceOpportunitySummary,
  MarketplaceSearchPayload,
  MarketplaceTrackPayload,
  OpportunityApplicationSummary,
  OpportunitySharePayload,
} from '@tsc/types';
import {
  canManageArtist,
  type MembershipContext,
} from '@tsc/permissions';
import {
  assertApplicationTransition,
  InvalidApplicationTransitionError,
} from './application-state';
import { ActivityService } from '../activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import { IntelligenceService } from '../intelligence/intelligence.service';
import type {
  ArtistApplicationsQuery,
  BrandApplicationReviewInput,
  BrandApplicationsQuery,
  MarketplaceBrowseQuery,
  MarketplaceListingTrackInput,
  MarketplaceListingsQuery,
  MarketplaceSearchQuery,
  OpportunityApplyInput,
  OpportunitySaveInput,
  OpportunityShareInput,
} from './dto';
import { DealService } from '../deal/deal.service';
import { OpportunityRepository } from './opportunity.repository';
import {
  applicationNotesFromMetadata,
  applicationMetadataWithNotes,
  opportunityArtistIdFromRow,
  opportunityDescriptionFromMetadata,
} from './application-metadata';
import { OpportunitySyncEmitter } from './opportunity-sync.emitter';

@Injectable()
export class OpportunityService {
  constructor(
    private readonly repository: OpportunityRepository,
    private readonly intelligenceService: IntelligenceService,
    private readonly syncEmitter: OpportunitySyncEmitter,
    private readonly activityService: ActivityService,
    private readonly creditsService: CreditsService,
    private readonly dealService: DealService,
  ) {}

  async browseListings(
    query: MarketplaceListingsQuery,
    ctx: MembershipContext,
  ): Promise<MarketplaceListingsPayload> {
    const rows = await this.repository.browseListings(query);

    const suggestedPayload = await this.intelligenceService.getSuggestedOpportunities(
      query.artistId,
      ctx,
    );
    const scoreById = new Map(
      suggestedPayload.suggestions.map((item) => [item.id, item.score]),
    );

    const items: MarketplaceListingSummary[] = rows.map((row) =>
      this.toListingSummary(row, scoreById.get(row.id) ?? null),
    );
    items.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

    return {
      items,
      filters: {
        type: query.type ?? null,
        city: query.city ?? null,
        genre: query.genre ?? null,
      },
      suggested: suggestedPayload.suggestions,
      updatedAt: new Date().toISOString(),
    };
  }

  async searchListings(
    query: MarketplaceSearchQuery,
    ctx: MembershipContext,
  ): Promise<MarketplaceSearchPayload> {
    const rows = await this.repository.searchListings(query);

    const suggestedPayload = await this.intelligenceService.getSuggestedOpportunities(
      undefined,
      ctx,
    );
    const scoreById = new Map(
      suggestedPayload.suggestions.map((item) => [item.id, item.score]),
    );

    const items = rows.map((row) =>
      this.toListingSummary(row, scoreById.get(row.id) ?? null),
    );

    return {
      query: query.q?.trim() ?? null,
      items,
      filters: {
        type: query.type ?? null,
        city: query.city ?? null,
        genre: query.genre ?? null,
      },
      total: items.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async getListingDetail(
    id: string,
    ctx: MembershipContext,
  ): Promise<MarketplaceListingDetail> {
    const row = await this.repository.findListing(id);
    if (!row) throw new NotFoundException(`Listing ${id} not found`);

    const personId = ctx.personId;
    const myApplication = personId
      ? await this.repository.findApplication(id, personId)
      : null;

    return {
      ...this.toListingSummary(row, null),
      description: opportunityDescriptionFromMetadata(row.metadata),
      myApplication: myApplication
        ? this.toBrandApplicationSummary(myApplication)
        : null,
    };
  }

  async trackListing(
    id: string,
    input: MarketplaceListingTrackInput,
    ctx: MembershipContext,
  ): Promise<MarketplaceTrackPayload> {
    await this.assertMarketplaceOpportunity(id);
    const personId = ctx.personId ?? null;

    await this.repository.createOpportunityActivity({
      opportunityId: id,
      type: 'marketplace_viewed',
      summary: 'Listing view tracked',
      actorId: personId,
      metadata: {
        artistId: input.artistId ?? ctx.artistMemberships[0] ?? null,
        source: input.source,
      },
    });

    return {
      listingId: id,
      tracked: true,
      stubbed: false,
      message: 'View recorded on opportunity activity stream',
    };
  }

  async listBrandApplications(
    brandId: string,
    query: BrandApplicationsQuery,
    ctx: MembershipContext,
    brandOwnerPersonId: string | null,
  ): Promise<BrandApplicationsPayload> {
    this.assertBrandReviewAccess(brandOwnerPersonId, ctx);

    const rows = await this.repository.listBrandApplications(brandId, query);
    return {
      brandId,
      items: rows.map((row) => this.toBrandApplicationSummary(row)),
      filters: {
        status: query.status ?? null,
        opportunityId: query.opportunityId ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async reviewBrandApplication(
    brandId: string,
    applicationId: string,
    input: BrandApplicationReviewInput,
    ctx: MembershipContext,
    brandOwnerPersonId: string | null,
  ): Promise<BrandApplicationReviewPayload> {
    this.assertBrandReviewAccess(brandOwnerPersonId, ctx);

    const application = await this.repository.findBrandOwnedApplication(
      brandId,
      applicationId,
    );
    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found for brand ${brandId}`);
    }

    const status = brandActionToStatus(input.action);
    try {
      assertApplicationTransition(
        application.status as OpportunityApplicationSummary['status'],
        status,
      );
    } catch (error) {
      if (error instanceof InvalidApplicationTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const updated = await this.repository.updateApplicationStatus(applicationId, {
      status,
      metadata: applicationMetadataWithNotes(
        application.metadata,
        input.notes ?? applicationNotesFromMetadata(application.metadata),
      ),
      updatedAt: new Date(),
    });

    if (ctx.personId) {
      await this.activityService.record({
        actorPersonId: ctx.personId,
        action: input.action === 'hire' ? 'hired_artist' : 'reviewed_application',
        targetType: 'OpportunityApplication',
        targetId: applicationId,
        metadata: {
          brandId,
          opportunityId: application.opportunityId,
          action: input.action,
          status,
        },
      });
    }

    if (status === 'won') {
      await this.activityService.record({
        actorPersonId: application.personId,
        action: 'won_opportunity',
        targetType: 'Opportunity',
        targetId: application.opportunityId,
        metadata: { applicationId, brandId, hiredVia: 'brand_review' },
      });
      void this.creditsService.earnFromOpportunityWon(
        application.personId,
        application.opportunityId,
      );
      void this.dealService.createFromHiredApplication(applicationId, ctx.personId);
    }

    return {
      applicationId,
      brandId,
      action: input.action,
      status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async browseMarketplace(
    query: MarketplaceBrowseQuery,
    ctx: MembershipContext,
  ): Promise<MarketplaceBrowsePayload> {
    const rows = await this.repository.browseMarketplace(query);

    const suggestedPayload = await this.intelligenceService.getSuggestedOpportunities(
      query.artistId,
      ctx,
    );

    const scoreById = new Map(
      suggestedPayload.suggestions.map((item) => [item.id, item.score]),
    );

    const items: MarketplaceOpportunitySummary[] = rows.map((row) =>
      this.toSummary(row, scoreById.get(row.id) ?? null),
    );

    items.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

    return {
      items,
      filters: {
        category: query.category ?? null,
        city: query.city ?? null,
        deadlineBefore: query.deadlineBefore ?? null,
      },
      suggested: suggestedPayload.suggestions,
      updatedAt: new Date().toISOString(),
    };
  }

  async getMarketplaceDetail(
    id: string,
    ctx: MembershipContext,
  ): Promise<MarketplaceOpportunityDetail> {
    const row = await this.repository.findMarketplaceOpportunity(id);
    if (!row) throw new NotFoundException(`Opportunity ${id} not found`);

    const personId = ctx.personId;
    const myApplication = personId
      ? await this.repository.findApplication(id, personId)
      : null;

    return {
      ...this.toSummary(row, null),
      description: opportunityDescriptionFromMetadata(row.metadata),
      artistId: opportunityArtistIdFromRow(row),
      metadata: parseMetadata(row.metadata),
      myApplication: myApplication ? this.toApplicationSummary(myApplication) : null,
    };
  }

  async saveOpportunity(
    id: string,
    input: OpportunitySaveInput,
    ctx: MembershipContext,
  ): Promise<OpportunityApplicationSummary> {
    await this.assertMarketplaceOpportunity(id);
    const personId = this.requirePersonId(ctx);
    const artistId = await this.resolveArtistId(input.artistId, ctx);

    const existing = await this.repository.findApplication(id, personId);
    if (existing && existing.status !== 'saved') {
      throw new BadRequestException(
        `Application already ${existing.status}; cannot save again`,
      );
    }

    const application = await this.repository.upsertSavedApplication({
      opportunityId: id,
      personId,
      artistId,
      notes: input.notes,
    });

    await this.repository.createOpportunityActivity({
      opportunityId: id,
      type: 'marketplace_saved',
      summary: 'Opportunity bookmarked',
      actorId: personId,
      metadata: { artistId, applicationId: application.id },
    });

    this.syncEmitter.emit({
      type: 'opportunity.saved',
      externalId: application.id,
      entityType: 'OpportunityApplication',
      data: {
        opportunityId: id,
        personId,
        artistId,
        status: 'saved',
      },
    });

    return this.toApplicationSummary(application);
  }

  async applyToOpportunity(
    id: string,
    input: OpportunityApplyInput,
    ctx: MembershipContext,
  ): Promise<OpportunityApplicationSummary> {
    await this.assertMarketplaceOpportunity(id);
    const personId = this.requirePersonId(ctx);
    const artistId = await this.resolveArtistId(input.artistId, ctx);

    const existing = await this.repository.findApplication(id, personId);
    if (existing) {
      try {
        assertApplicationTransition(existing.status, 'applied');
      } catch (error) {
        if (error instanceof InvalidApplicationTransitionError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
    }

    const application = await this.repository.upsertAppliedApplication({
      opportunityId: id,
      personId,
      artistId,
      notes: input.notes,
    });

    const opportunity = await this.repository.findMarketplaceOpportunity(id);

    await this.activityService.record({
      actorPersonId: personId,
      action: 'applied_opportunity',
      targetType: 'Opportunity',
      targetId: id,
      metadata: {
        opportunityTitle: opportunity?.title ?? id,
        artistId,
        applicationId: application.id,
      },
    });

    await this.repository.createOpportunityActivity({
      opportunityId: id,
      type: 'marketplace_applied',
      summary: 'Artist applied via marketplace',
      actorId: personId,
      metadata: { artistId, applicationId: application.id },
    });

    this.syncEmitter.emit({
      type: 'opportunity.applied',
      externalId: application.id,
      entityType: 'OpportunityApplication',
      data: {
        opportunityId: id,
        personId,
        artistId,
        status: 'applied',
        appliedAt: application.appliedAt?.toISOString() ?? new Date().toISOString(),
      },
    });

    return this.toApplicationSummary(application);
  }

  async shareOpportunity(
    id: string,
    _input: OpportunityShareInput,
    ctx: MembershipContext,
  ): Promise<OpportunitySharePayload> {
    await this.assertMarketplaceOpportunity(id);
    this.requirePersonId(ctx);

    const baseUrl = process.env.TSC_PUBLIC_URL ?? 'https://tsc.onrender.com';
    return {
      opportunityId: id,
      shareUrl: `${baseUrl}/marketplace/listings/${id}`,
      message: 'Share stub — wire to email/WhatsApp when messaging is ready',
      stubbed: true,
    };
  }

  async listArtistApplications(
    artistId: string,
    query: ArtistApplicationsQuery,
    ctx: MembershipContext,
  ): Promise<{ artistId: string; applications: OpportunityApplicationSummary[]; updatedAt: string }> {
    this.assertArtistAccess(ctx, artistId);

    const rows = await this.repository.listArtistApplications(artistId, query);
    return {
      artistId,
      applications: rows.map((row) => this.toApplicationSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async updateArtistApplicationStatus(
    artistId: string,
    applicationId: string,
    status: 'shortlisted' | 'won' | 'rejected',
    ctx: MembershipContext,
  ): Promise<OpportunityApplicationSummary> {
    this.assertArtistAccess(ctx, artistId);

    const application = await this.repository.findApplicationById(applicationId);
    if (!application || application.artistId !== artistId) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    try {
      assertApplicationTransition(application.status, status);
    } catch (error) {
      if (error instanceof InvalidApplicationTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const updated = await this.repository.updateApplicationStatus(applicationId, {
      status,
      updatedAt: new Date(),
    });

    if (status === 'won') {
      await this.activityService.record({
        actorPersonId: application.personId,
        action: 'won_opportunity',
        targetType: 'Opportunity',
        targetId: application.opportunityId,
        metadata: {
          applicationId,
          artistId,
        },
      });
      void this.creditsService.earnFromOpportunityWon(
        application.personId,
        application.opportunityId,
      );
    }

    return this.toApplicationSummary(updated);
  }

  /** Consumed by Artist Passport module — read-only history. */
  async getPassportOpportunityHistory(artistId: string) {
    const rows = await this.repository.listPassportApplications(artistId);
    return rows.map((row) => ({
      opportunityId: row.opportunityId,
      title: row.opportunity.title,
      category: row.opportunity.category,
      status: row.status,
      appliedAt: row.appliedAt?.toISOString() ?? null,
    }));
  }

  private async assertMarketplaceOpportunity(id: string) {
    const row = await this.repository.findMarketplaceOpportunity(id);
    if (!row) throw new NotFoundException(`Opportunity ${id} not found`);
    return row;
  }

  private requirePersonId(ctx: MembershipContext): string {
    if (!ctx.personId) {
      throw new ForbiddenException('Authenticated person required');
    }
    return ctx.personId;
  }

  private async resolveArtistId(
    artistId: string | undefined,
    ctx: MembershipContext,
  ): Promise<string | null> {
    if (!artistId) {
      return ctx.artistMemberships[0] ?? null;
    }
    this.assertArtistAccess(ctx, artistId);
    const artist = await this.repository.resolveArtistPersonId(artistId);
    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);
    return artist.id;
  }

  private assertArtistAccess(ctx: MembershipContext, artistId: string) {
    if (!canManageArtist(ctx, artistId)) {
      throw new ForbiddenException('Artist access required');
    }
  }

  private assertBrandReviewAccess(
    brandOwnerPersonId: string | null,
    ctx: MembershipContext,
  ) {
    if (ctx.roles.includes('admin')) return;
    if (brandOwnerPersonId && ctx.personId === brandOwnerPersonId) return;
    throw new ForbiddenException('Brand review access required');
  }

  private toListingSummary(
    row: {
      id: string;
      title: string;
      listingType?: string | null;
      category?: string | null;
      brandId?: string | null;
      agencyId?: string | null;
      artistId?: string | null;
      ownerType?: string | null;
      ownerId?: string | null;
      budget?: unknown;
      value: unknown;
      city?: string | null;
      genre?: string | null;
      status: string;
      requirements?: string[];
      deadline?: Date | null;
      source: string | null;
      updatedAt: Date;
      brand?: { id: string; name: string; verified: boolean } | null;
      agency?: { id: string; name: string } | null;
      organization?: { name: string } | null;
      _count?: { applications: number };
    },
    matchScore: number | null,
  ): MarketplaceListingSummary {
    const owner = resolveListingOwner(row);
    const budget = row.budget != null ? Number(row.budget) : row.value != null ? Number(row.value) : null;

    return {
      id: row.id,
      title: row.title,
      listingType: resolveListingType(row),
      category: (row.category as MarketplaceListingSummary['category']) ?? null,
      ownerType: owner.type,
      ownerId: owner.id,
      ownerName: owner.name,
      ownerVerified: owner.verified,
      budget,
      city: row.city ?? null,
      genre: row.genre ?? null,
      status: row.status,
      requirements: row.requirements ?? [],
      deadline: row.deadline?.toISOString() ?? null,
      source: row.source,
      applicationCount: row._count?.applications ?? 0,
      updatedAt: row.updatedAt.toISOString(),
      matchScore,
    };
  }

  private toBrandApplicationSummary(row: {
    id: string;
    opportunityId: string;
    personId: string;
    artistId: string | null;
    status: string;
    appliedAt: Date | null;
    metadata?: import('@tsc/database').Prisma.JsonValue | null;
    updatedAt: Date;
    opportunity?: {
      id: string;
      title: string;
      listingType?: string | null;
      category?: string | null;
    };
    person?: { displayName: string | null; name?: string | null; email?: string | null };
    artist?: { name: string; genre?: string | null };
  }): BrandApplicationSummary {
    const notes = applicationNotesFromMetadata(row.metadata);
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      listingTitle: row.opportunity?.title ?? row.opportunityId,
      listingType: row.opportunity
        ? resolveListingType(row.opportunity)
        : null,
      personId: row.personId,
      personName:
        row.person?.displayName?.trim() || row.person?.name?.trim() || null,
      artistId: row.artistId,
      artistName: row.artist?.name ?? null,
      artistGenre: row.artist?.genre ?? null,
      status: row.status as BrandApplicationSummary['status'],
      appliedAt: row.appliedAt?.toISOString() ?? null,
      notes,
      createdAt: row.appliedAt?.toISOString() ?? row.updatedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toSummary(
    row: {
      id: string;
      title: string;
      category?: string | null;
      city?: string | null;
      deadline?: Date | null;
      status: string;
      value: unknown;
      source: string | null;
      updatedAt: Date;
      organization?: { name: string } | null;
      _count?: { applications: number };
    },
    matchScore: number | null,
  ): MarketplaceOpportunitySummary {
    return {
      id: row.id,
      title: row.title,
      category: (row.category as MarketplaceOpportunitySummary['category']) ?? null,
      city: row.city ?? null,
      deadline: row.deadline?.toISOString() ?? null,
      status: row.status,
      value: row.value != null ? Number(row.value) : null,
      source: row.source,
      organizationName: row.organization?.name ?? null,
      applicationCount: row._count?.applications ?? 0,
      updatedAt: row.updatedAt.toISOString(),
      matchScore,
    };
  }

  private toApplicationSummary(row: {
    id: string;
    opportunityId: string;
    personId: string;
    artistId: string | null;
    status: string;
    appliedAt: Date | null;
    metadata?: import('@tsc/database').Prisma.JsonValue | null;
    updatedAt: Date;
    opportunity?: {
      id: string;
      title: string;
      category?: string | null;
      city?: string | null;
      deadline?: Date | null;
      status: string;
      value: unknown;
    };
  }): OpportunityApplicationSummary {
    const notes = applicationNotesFromMetadata(row.metadata);
    return {
      id: row.id,
      opportunityId: row.opportunityId,
      personId: row.personId,
      artistId: row.artistId,
      status: row.status as OpportunityApplicationSummary['status'],
      appliedAt: row.appliedAt?.toISOString() ?? null,
      notes,
      createdAt: row.appliedAt?.toISOString() ?? row.updatedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      opportunity: row.opportunity
        ? {
            id: row.opportunity.id,
            title: row.opportunity.title,
            category: (row.opportunity.category as MarketplaceOpportunitySummary['category']) ?? null,
            city: row.opportunity.city ?? null,
            deadline: row.opportunity.deadline?.toISOString() ?? null,
            status: row.opportunity.status,
            value: row.opportunity.value != null ? Number(row.opportunity.value) : null,
          }
        : undefined,
    };
  }
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function resolveListingOwner(row: {
  brandId?: string | null;
  agencyId?: string | null;
  artistId?: string | null;
  ownerType?: string | null;
  ownerId?: string | null;
  brand?: { id: string; name: string; verified: boolean } | null;
  agency?: { id: string; name: string } | null;
  organization?: { name: string } | null;
}): {
  type: MarketplaceListingSummary['ownerType'];
  id: string | null;
  name: string | null;
  verified?: boolean;
} {
  if (row.ownerType && row.ownerId) {
    if (row.ownerType === 'brand' && row.brand) {
      return {
        type: 'brand',
        id: row.ownerId,
        name: row.brand.name,
        verified: row.brand.verified,
      };
    }
    if (row.ownerType === 'agency' && row.agency) {
      return { type: 'agency', id: row.ownerId, name: row.agency.name };
    }
    if (row.ownerType === 'artist') {
      return {
        type: 'artist',
        id: row.ownerId,
        name: row.organization?.name ?? null,
      };
    }
  }

  if (row.brandId && row.brand) {
    return {
      type: 'brand',
      id: row.brandId,
      name: row.brand.name,
      verified: row.brand.verified,
    };
  }
  if (row.agencyId && row.agency) {
    return { type: 'agency', id: row.agencyId, name: row.agency.name };
  }
  if (row.organization?.name) {
    return { type: null, id: null, name: row.organization.name };
  }
  return { type: null, id: null, name: null };
}

function brandActionToStatus(
  action: BrandApplicationReviewAction,
): 'shortlisted' | 'won' | 'rejected' {
  if (action === 'shortlist') return 'shortlisted';
  if (action === 'hire') return 'won';
  return 'rejected';
}
