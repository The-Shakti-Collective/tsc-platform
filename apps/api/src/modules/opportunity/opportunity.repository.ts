import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  brandApplicationInclude,
  marketplaceBrowseWhere,
  marketplaceListingBrowseWhere,
  marketplaceListingInclude,
  marketplaceListingSearchWhere,
  marketplaceOpportunityInclude,
  opportunityApplicationInclude,
  type MarketplaceListingTypeValue,
  type MarketplaceOwnerTypeValue,
  type OpportunityCategoryValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import { applicationMetadataWithNotes } from './application-metadata';
import type {
  ArtistApplicationsQuery,
  BrandApplicationsQuery,
  MarketplaceBrowseQuery,
  MarketplaceListingsQuery,
  MarketplaceSearchQuery,
} from './dto';

@Injectable()
export class OpportunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  browseMarketplace(query: MarketplaceBrowseQuery) {
    return this.prisma.client.opportunity.findMany({
      where: marketplaceBrowseWhere({
        category: query.category as OpportunityCategoryValue | undefined,
        city: query.city,
        deadlineBefore: query.deadlineBefore ? new Date(query.deadlineBefore) : undefined,
        deadlineAfter: query.deadlineAfter ? new Date(query.deadlineAfter) : undefined,
      }),
      include: marketplaceOpportunityInclude,
      orderBy: [{ deadline: 'asc' }, { updatedAt: 'desc' }],
      take: query.limit,
    });
  }

  browseListings(query: MarketplaceListingsQuery) {
    return this.prisma.client.opportunity.findMany({
      where: marketplaceListingBrowseWhere({
        type: query.type as MarketplaceListingTypeValue | undefined,
        city: query.city,
        genre: query.genre,
        ownerId: query.ownerId,
        ownerType: query.ownerType as MarketplaceOwnerTypeValue | undefined,
      }),
      include: marketplaceListingInclude,
      orderBy: [{ deadline: 'asc' }, { updatedAt: 'desc' }],
      take: query.limit,
    });
  }

  searchListings(query: MarketplaceSearchQuery) {
    return this.prisma.client.opportunity.findMany({
      where: marketplaceListingSearchWhere({
        q: query.q,
        type: query.type as MarketplaceListingTypeValue | undefined,
        city: query.city,
        genre: query.genre,
      }),
      include: marketplaceListingInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: query.limit,
    });
  }

  findListing(id: string) {
    return this.prisma.client.opportunity.findFirst({
      where: {
        id,
        marketplaceVisible: true,
      },
      include: marketplaceListingInclude,
    });
  }

  findMarketplaceOpportunity(id: string) {
    return this.prisma.client.opportunity.findFirst({
      where: {
        id,
        marketplaceVisible: true,
      },
      include: marketplaceOpportunityInclude,
    });
  }

  findApplication(opportunityId: string, personId: string) {
    return this.prisma.client.opportunityApplication.findFirst({
      where: { opportunityId, personId },
      include: opportunityApplicationInclude,
    });
  }

  findApplicationById(id: string) {
    return this.prisma.client.opportunityApplication.findUnique({
      where: { id },
      include: opportunityApplicationInclude,
    });
  }

  async upsertSavedApplication(input: {
    opportunityId: string;
    personId: string;
    artistId?: string | null;
    notes?: string | null;
  }) {
    const existing = await this.findApplication(input.opportunityId, input.personId);
    if (existing) {
      return this.prisma.client.opportunityApplication.update({
        where: { id: existing.id },
        data: {
          artistId: input.artistId ?? undefined,
          status: 'saved',
          metadata: applicationMetadataWithNotes(existing.metadata, input.notes),
        },
        include: opportunityApplicationInclude,
      });
    }

    return this.prisma.client.opportunityApplication.create({
      data: {
        id: newId(),
        opportunityId: input.opportunityId,
        personId: input.personId,
        artistId: input.artistId ?? null,
        status: 'saved',
        metadata: applicationMetadataWithNotes(null, input.notes),
      },
      include: opportunityApplicationInclude,
    });
  }

  async upsertAppliedApplication(input: {
    opportunityId: string;
    personId: string;
    artistId?: string | null;
    notes?: string | null;
  }) {
    const existing = await this.findApplication(input.opportunityId, input.personId);
    if (existing) {
      return this.prisma.client.opportunityApplication.update({
        where: { id: existing.id },
        data: {
          artistId: input.artistId ?? undefined,
          status: 'applied',
          appliedAt: new Date(),
          metadata: applicationMetadataWithNotes(existing.metadata, input.notes),
        },
        include: opportunityApplicationInclude,
      });
    }

    return this.prisma.client.opportunityApplication.create({
      data: {
        id: newId(),
        opportunityId: input.opportunityId,
        personId: input.personId,
        artistId: input.artistId ?? null,
        status: 'applied',
        appliedAt: new Date(),
        metadata: applicationMetadataWithNotes(null, input.notes ?? null),
      },
      include: opportunityApplicationInclude,
    });
  }

  updateApplicationStatus(
    id: string,
    data: Prisma.OpportunityApplicationUpdateInput,
  ) {
    return this.prisma.client.opportunityApplication.update({
      where: { id },
      data,
      include: opportunityApplicationInclude,
    });
  }

  listArtistApplications(artistId: string, query: ArtistApplicationsQuery) {
    const where: Prisma.OpportunityApplicationWhereInput = { artistId };
    if (query.status) where.status = query.status;

    return this.prisma.client.opportunityApplication.findMany({
      where,
      include: opportunityApplicationInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: query.limit,
    });
  }

  /** Passport + marketplace — opportunity history for public artist profile. */
  listPassportApplications(artistId: string) {
    return this.prisma.client.opportunityApplication.findMany({
      where: {
        artistId,
        status: { in: ['applied', 'shortlisted', 'won', 'rejected'] },
      },
      include: opportunityApplicationInclude,
      orderBy: [{ appliedAt: 'desc' }],
      take: 20,
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

  resolveArtistPersonId(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, personId: true, name: true },
    });
  }

  listBrandApplications(brandId: string, query: BrandApplicationsQuery) {
    const where: Prisma.OpportunityApplicationWhereInput = {
      opportunity: { brandId },
      status: query.status
        ? query.status
        : { in: ['applied', 'shortlisted', 'won', 'rejected'] },
    };
    if (query.opportunityId) {
      where.opportunityId = query.opportunityId;
    }

    return this.prisma.client.opportunityApplication.findMany({
      where,
      include: brandApplicationInclude,
      orderBy: [{ appliedAt: 'desc' }, { updatedAt: 'desc' }],
      take: query.limit,
    });
  }

  findBrandOwnedApplication(brandId: string, applicationId: string) {
    return this.prisma.client.opportunityApplication.findFirst({
      where: {
        id: applicationId,
        opportunity: { brandId },
      },
      include: brandApplicationInclude,
    });
  }
}
