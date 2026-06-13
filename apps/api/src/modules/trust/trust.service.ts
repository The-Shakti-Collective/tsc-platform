import {

  ForbiddenException,

  Injectable,

  NotFoundException,

  ServiceUnavailableException,

} from '@nestjs/common';

import {

  calculateAgencyTrustFactors,

  calculateAgencyTrustScore,

  calculateArtistTrustFactors,

  calculateArtistTrustScore,

  calculateBrandTrustFactors,

  calculateBrandTrustScore,

  scoreArtistOpportunities,

  scoreBrandMatchCandidates,

  type ArtistTrustInput,

  type BrandTrustInput,

  type AgencyTrustInput,

} from '@tsc/analytics';

import type {

  AgencyTrustFactors,

  ArtistTrustFactors,

  BrandTrustFactors,

  TrustEntityTypeValue,

} from '@tsc/database';

import { resolveTrustBadges } from '@tsc/database';

import type {

  ArtistOpportunitiesV2Payload,

  BrandMatchPayload,

  TrustRefreshPayload,

  TrustSnapshotPayload,

} from '@tsc/types';

import type { ArtistOpportunitiesV2Input, BrandMatchV2Input } from '@tsc/contracts/trust';

import type { MembershipContext } from '@tsc/permissions';

import { canManageArtist } from '@tsc/permissions';

import { TrustRepository } from './trust.repository';



function daysAgo(days: number): Date {

  const date = new Date();

  date.setDate(date.getDate() - days);

  return date;

}



function parseFactors(value: unknown): ArtistTrustFactors | BrandTrustFactors | AgencyTrustFactors {

  if (!value || typeof value !== 'object' || Array.isArray(value)) {

    return {} as ArtistTrustFactors;

  }

  return value as ArtistTrustFactors;

}



@Injectable()

export class TrustService {

  constructor(private readonly repository: TrustRepository) {}



  async getArtistTrust(artistId: string): Promise<TrustSnapshotPayload> {

    this.assertAvailable();

    const snapshot = await this.repository.findLatestSnapshot('Artist', artistId);

    if (snapshot) return this.toPayload(snapshot);

    return this.computeArtistTrust(artistId);

  }



  async getBrandTrust(brandId: string): Promise<TrustSnapshotPayload> {

    this.assertAvailable();

    const snapshot = await this.repository.findLatestSnapshot('Brand', brandId);

    if (snapshot) return this.toPayload(snapshot);

    return this.computeBrandTrust(brandId);

  }



  async getAgencyTrust(agencyId: string): Promise<TrustSnapshotPayload> {

    this.assertAvailable();

    const snapshot = await this.repository.findLatestSnapshot('Agency', agencyId);

    if (snapshot) return this.toPayload(snapshot);

    return this.computeAgencyTrust(agencyId);

  }



  async refresh(

    entityType: TrustEntityTypeValue,

    entityId: string,

    ctx: MembershipContext,

  ): Promise<TrustRefreshPayload> {

    if (!ctx.roles.includes('admin')) {

      throw new ForbiddenException('Admin access required to refresh trust scores');

    }



    const snapshot =

      entityType === 'Artist'

        ? await this.computeArtistTrust(entityId)

        : entityType === 'Brand'

          ? await this.computeBrandTrust(entityId)

          : await this.computeAgencyTrust(entityId);



    const entityUpdated =

      entityType === 'Brand'

        ? await this.repository.updateBrandTrustScore(entityId, snapshot.trustScore)

        : false;



    return { entityType, entityId, snapshot, entityUpdated };

  }



  async brandMatch(input: BrandMatchV2Input, _ctx: MembershipContext): Promise<BrandMatchPayload> {

    this.assertAvailable();

    const brand = await this.repository.findBrand(input.brandId);

    if (!brand) throw new NotFoundException(`Brand ${input.brandId} not found`);



    const cityMetrics = input.city ? await this.repository.computeCityCounts(input.city) : undefined;

    const artists = await this.repository.listArtistsForMatching(60);



    const candidates = await Promise.all(

      artists.map(async (artist) => {

        const trust = await this.getArtistTrustCached(artist.id);

        const genres = artist.person?.profile?.genres ?? [];

        const city = artist.person?.profile?.city ?? null;

        const followerCount = await this.repository.countArtistFollowers(artist.id);



        return {

          artistId: artist.id,

          artistName: artist.name,

          slug: artist.slug,

          city,

          genres,

          followerCount,

          trustScore: trust.trustScore,

          engagementScore: Math.min(followerCount / 500, 100),

          cityMetrics,

        };

      }),

    );



    const items = scoreBrandMatchCandidates(

      {

        brandId: input.brandId,

        genre: input.genre,

        city: input.city,

        budget: input.budget,

        audienceAge: input.audienceAge,

      },

      candidates,

    ).slice(0, 25);



    return {

      brandId: input.brandId,

      criteria: {

        genre: input.genre ?? null,

        city: input.city ?? null,

        budget: input.budget ?? null,

        audienceAge: input.audienceAge ?? null,

      },

      items,

      updatedAt: new Date().toISOString(),

    };

  }



  async artistOpportunitiesV2(

    input: ArtistOpportunitiesV2Input,

    ctx: MembershipContext,

  ): Promise<ArtistOpportunitiesV2Payload> {

    this.assertAvailable();

    if (!canManageArtist(ctx, input.artistId) && !ctx.roles.includes('admin')) {

      throw new ForbiddenException('Artist access required');

    }



    const artist = await this.repository.findArtist(input.artistId);

    if (!artist) throw new NotFoundException(`Artist ${input.artistId} not found`);



    const artistGenres = artist.person?.profile?.genres ?? [];

    const artistCity = artist.person?.profile?.city ?? null;

    const listings = await this.repository.listOpenListingsForArtist(input.artistId);



    const candidates = listings.map((row) => ({

      opportunityId: row.id,

      title: row.title,

      listingType: row.listingType ?? null,

      city: row.city ?? null,

      genre: row.genre ?? null,

      budget:

        row.budget != null

          ? Number(row.budget)

          : row.value != null

            ? Number(row.value)

            : null,

      brandId: row.brandId ?? null,

      brandTrustScore: row.brand?.trustScore ?? null,

      artistGenres,

      artistCity,

      engagement: 55,

    }));



    const items = scoreArtistOpportunities(candidates, input.limit);



    return {

      artistId: input.artistId,

      items,

      updatedAt: new Date().toISOString(),

    };

  }



  private async getArtistTrustCached(artistId: string): Promise<TrustSnapshotPayload> {

    const snapshot = await this.repository.findLatestSnapshot('Artist', artistId);

    if (snapshot) return this.toPayload(snapshot);

    return this.computeArtistTrust(artistId);

  }



  async computeArtistTrust(artistId: string): Promise<TrustSnapshotPayload> {

    const artist = await this.repository.findArtist(artistId);

    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);



    const [

      eventsPerformed,

      eventsWithAttendance,

      applicationsTotal,

      applicationsResponded,

      completedDeals,

      totalDeals,

      communityPosts,

      communityMemberships,

      acceptedCollaborations,

      verificationLevel,

    ] = await Promise.all([

      this.repository.countArtistEvents(artistId),

      this.repository.countArtistEventsWithAttendance(artistId),

      this.repository.countArtistApplications(artistId),

      this.repository.countArtistRespondedApplications(artistId),

      this.repository.countArtistCompletedDeals(artistId),

      this.repository.countArtistTotalDeals(artistId),

      this.repository.countArtistCommunityPosts(artistId),

      this.repository.countArtistCommunityMemberships(artistId),

      this.repository.countArtistCollaborations(artistId),

      this.repository.getArtistVerificationLevel(artistId),

    ]);



    const signals: ArtistTrustInput = {

      eventsPerformed,

      eventsWithAttendance,

      applicationsTotal,

      applicationsResponded,

      completedDeals,

      totalDeals,

      communityPosts,

      communityMemberships,

      acceptedCollaborations,

    };



    const factors = calculateArtistTrustFactors(signals);

    const trustScore = calculateArtistTrustScore(signals);

    const rankPercentile = await this.computeRankPercentile('Artist', trustScore);

    const badges = resolveTrustBadges({

      entityType: 'Artist',

      trustScore,

      artistVerificationLevel: verificationLevel,

    });



    const row = await this.repository.createSnapshot({

      entityType: 'Artist',

      entityId: artistId,

      trustScore,

      factors,

      badges,

      rankPercentile,

    });



    return row

      ? this.toPayload(row)

      : this.buildPayload('Artist', artistId, trustScore, factors, badges, rankPercentile);

  }



  async computeBrandTrust(brandId: string): Promise<TrustSnapshotPayload> {

    const brand = await this.repository.findBrand(brandId);

    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);



    const [revenue, completedDeals, totalDeals] = await Promise.all([

      this.repository.aggregateBrandRevenue(brandId),

      this.repository.countBrandDeals(brandId, true),

      this.repository.countBrandDeals(brandId, false),

    ]);



    const signals: BrandTrustInput = {

      receivedAmount: revenue.received,

      expectedAmount: revenue.expected,

      completedDeals,

      totalDeals,

      verified: brand.verified,

    };



    const factors = calculateBrandTrustFactors(signals);

    const trustScore = calculateBrandTrustScore(signals);

    const rankPercentile = await this.computeRankPercentile('Brand', trustScore);

    const badges = resolveTrustBadges({

      entityType: 'Brand',

      trustScore,

      brandVerified: brand.verified,

    });



    const row = await this.repository.createSnapshot({

      entityType: 'Brand',

      entityId: brandId,

      trustScore,

      factors,

      badges,

      rankPercentile,

    });



    await this.repository.updateBrandTrustScore(brandId, trustScore);



    return row

      ? this.toPayload(row)

      : this.buildPayload('Brand', brandId, trustScore, factors, badges, rankPercentile);

  }



  async computeAgencyTrust(agencyId: string): Promise<TrustSnapshotPayload> {

    const agency = await this.repository.findAgency(agencyId);

    if (!agency) throw new NotFoundException(`Agency ${agencyId} not found`);



    const since90 = daysAgo(90);

    const [rosterCount, rosterAddedLast90, completedDeals, totalDeals] = await Promise.all([

      this.repository.countAgencyRoster(agencyId),

      this.repository.countAgencyRosterAddedSince(agencyId, since90),

      this.repository.countAgencyCompletedDeals(agencyId),

      this.repository.countAgencyTotalDeals(agencyId),

    ]);



    const campaignSuccessRate =

      totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : rosterCount > 0 ? 45 : 0;



    const signals: AgencyTrustInput = {

      rosterCount,

      rosterAddedLast90,

      campaignSuccessRate,

    };



    const factors = calculateAgencyTrustFactors(signals);

    const trustScore = calculateAgencyTrustScore(signals);

    const rankPercentile = await this.computeRankPercentile('Agency', trustScore);

    const badges = resolveTrustBadges({ entityType: 'Agency', trustScore });



    const row = await this.repository.createSnapshot({

      entityType: 'Agency',

      entityId: agencyId,

      trustScore,

      factors,

      badges,

      rankPercentile,

    });



    return row

      ? this.toPayload(row)

      : this.buildPayload('Agency', agencyId, trustScore, factors, badges, rankPercentile);

  }



  private async computeRankPercentile(

    entityType: TrustEntityTypeValue,

    trustScore: number,

  ): Promise<number | null> {

    const scores = await this.repository.listTrustScores(entityType);

    if (scores.length === 0) return null;

    const below = scores.filter((score) => score < trustScore).length;

    return Math.round((below / scores.length) * 10000) / 100;

  }



  private toPayload(row: {

    entityType: string;

    entityId: string;

    snapshotDate: Date;

    trustScore: number;

    factors: unknown;

    badges: string[];

    rankPercentile: number | null;

  }): TrustSnapshotPayload {

    return {

      entityType: row.entityType as TrustEntityTypeValue,

      entityId: row.entityId,

      trustScore: row.trustScore,

      factors: parseFactors(row.factors),

      badges: row.badges,

      rankPercentile: row.rankPercentile,

      snapshotDate: row.snapshotDate.toISOString(),

      updatedAt: new Date().toISOString(),

    };

  }



  private buildPayload(

    entityType: TrustEntityTypeValue,

    entityId: string,

    trustScore: number,

    factors: ArtistTrustFactors | BrandTrustFactors | AgencyTrustFactors,

    badges: string[],

    rankPercentile: number | null,

  ): TrustSnapshotPayload {

    return {

      entityType,

      entityId,

      trustScore,

      factors,

      badges,

      rankPercentile,

      snapshotDate: new Date().toISOString(),

      updatedAt: new Date().toISOString(),

    };

  }



  private assertAvailable() {

    if (!this.repository.isAvailable()) {

      throw new ServiceUnavailableException(

        'TrustSnapshot model not merged — apply phase7-month4.prisma migration',

      );

    }

  }

}

