import { Injectable, NotFoundException } from '@nestjs/common';

import type {

  ArtistAudienceOSDashboardPayload,

  ArtistAudienceOSExportPayload,

  ArtistAudienceOSTopFan,

  CommunityAudienceOSDashboardPayload,

} from '@tsc/types';

import { AudienceService } from '../audience/audience.service';

import { SuperfanService } from '../fan/superfan.service';

import { SupportService } from '../support/support.service';

import { AudienceOsRepository } from './audience-os.repository';



function round2(value: number): number {

  return Math.round(value * 100) / 100;

}



function displayArtistName(artist: {

  displayName: string | null;

  name: string;

}): string {

  return artist.displayName?.trim() || artist.name;

}



@Injectable()

export class AudienceOsService {

  constructor(

    private readonly repository: AudienceOsRepository,

    private readonly audienceService: AudienceService,

    private readonly superfanService: SuperfanService,

    private readonly supportService: SupportService,

  ) {}



  async getArtistDashboard(

    artistId: string,

    limit = 10,

  ): Promise<ArtistAudienceOSDashboardPayload> {

    const artist = await this.repository.findArtist(artistId);

    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);



    const mapLimit = Math.min(limit, 15);



    const [

      audienceHealth,

      superfansPayload,

      supportersPayload,

      audienceMap,

      supportRevenue,

      dealRevenue,

      commerce,

      membership,

    ] = await Promise.all([

      this.audienceService.getArtistAudienceHealth(artistId),

      this.superfanService.getArtistSuperfans(artistId, limit),

      this.supportService.getArtistSupporters(artistId, limit, 'amount'),

      this.repository.aggregateArtistCityMap(artistId, mapLimit),

      this.repository.sumArtistSupportRevenue(artistId),

      this.repository.sumArtistDealRevenue(artistId),

      this.repository.aggregateArtistPurchases(artistId),

      this.repository.aggregateArtistMembership(artistId),

    ]);



    const topFans = this.mergeTopFans(superfansPayload.superfans, supportersPayload.supporters, limit);



    const purchaseTotal = commerce.total;

    const supportTotal = supportRevenue.total;

    const dealTotal = dealRevenue.total;

    const combinedTotal = round2(supportTotal + purchaseTotal + dealTotal);



    return {

      artistId,

      name: displayArtistName(artist),

      slug: artist.slug ?? null,

      audienceMap,

      topFans,

      revenue: {

        supportTotal,

        purchaseTotal,

        dealTotal,

        combinedTotal,

        currency: commerce.currency ?? supportRevenue.currency,

        breakdown: {

          support: supportTotal,

          purchases: purchaseTotal,

          deals: dealTotal,

        },

      },

      retention: {

        fanRetention: audienceHealth.fanRetention,

        audienceChurn: audienceHealth.audienceChurn,

        fanConversion: audienceHealth.fanConversion,

        lifetimeValueStub: audienceHealth.lifetimeValueStub,

        snapshotDate: audienceHealth.snapshotDate,

      },

      growth: {

        audienceGrowth: audienceHealth.audienceGrowth,

        snapshotDate: audienceHealth.snapshotDate,

        metrics: audienceHealth.metrics,

      },

      membership,

      commerce,

      updatedAt: new Date().toISOString(),

    };

  }



  async exportArtistDashboard(artistId: string): Promise<ArtistAudienceOSExportPayload> {

    const dashboard = await this.getArtistDashboard(artistId);

    return {

      artistId,

      exportedAt: new Date().toISOString(),

      format: 'json',

      dashboard,

    };

  }



  async getCommunityDashboard(

    communityId: string,

    limit = 10,

  ): Promise<CommunityAudienceOSDashboardPayload> {

    const community = await this.repository.findCommunity(communityId);

    if (!community) throw new NotFoundException(`Community ${communityId} not found`);



    const [snapshot, topContributors, membershipPrograms] = await Promise.all([

      this.audienceService.getCommunityAudience(communityId),

      this.repository.listCommunityTopContributors(communityId, limit),

      this.repository.aggregateCommunityMembershipPrograms(communityId),

    ]);



    return {

      communityId,

      name: community.name,

      slug: community.slug ?? null,

      activeMembers: snapshot.activeMembers,

      membershipRevenueStub: snapshot.membershipRevenueStub,

      fanGrowth: snapshot.fanGrowth,

      eventConversion: snapshot.eventConversion,

      memberGrowth: snapshot.memberGrowth,

      snapshotDate: snapshot.snapshotDate,

      topContributors,

      membershipPrograms,

      updatedAt: new Date().toISOString(),

    };

  }



  private mergeTopFans(

    superfans: Array<{

      personId: string;

      displayName: string;

      slug: string | null;

      superfanScore: number;

      tier: string;

    }>,

    supporters: Array<{

      personId: string;

      displayName: string;

      slug: string | null;

      totalAmount: number;

      supportCount: number;

    }>,

    limit: number,

  ): ArtistAudienceOSTopFan[] {

    const byPerson = new Map<string, ArtistAudienceOSTopFan>();



    for (const fan of superfans) {

      byPerson.set(fan.personId, {

        personId: fan.personId,

        displayName: fan.displayName,

        slug: fan.slug,

        source: 'superfan',

        score: fan.superfanScore,

        tier: fan.tier,

      });

    }



    for (const supporter of supporters) {

      const existing = byPerson.get(supporter.personId);

      const supporterScore = round2(supporter.totalAmount + supporter.supportCount * 10);

      if (!existing) {

        byPerson.set(supporter.personId, {

          personId: supporter.personId,

          displayName: supporter.displayName,

          slug: supporter.slug,

          source: 'supporter',

          score: supporterScore,

          totalSpent: supporter.totalAmount,

          supportCount: supporter.supportCount,

        });

        continue;

      }

      byPerson.set(supporter.personId, {

        ...existing,

        score: round2(Math.max(existing.score, supporterScore)),

        totalSpent: supporter.totalAmount,

        supportCount: supporter.supportCount,

      });

    }



    return [...byPerson.values()]

      .sort((a, b) => b.score - a.score)

      .slice(0, limit);

  }

}


