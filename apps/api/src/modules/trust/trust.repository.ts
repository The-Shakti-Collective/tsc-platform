import { Injectable } from '@nestjs/common';

import type { Prisma } from '@tsc/database';

import {

  trustSnapshotWhere,

  type AgencyTrustFactors,

  type ArtistTrustFactors,

  type BrandTrustFactors,

  type TrustEntityTypeValue,

} from '@tsc/database';

import { PrismaService } from '../../common/database/prisma.service';

import { newId } from '../../common/ids';

import { toInputJson } from '../../common/json';



type TrustSnapshotRow = {

  id: string;

  entityType: string;

  entityId: string;

  snapshotDate: Date;

  trustScore: number;

  factors: Prisma.JsonValue;

  badges: string[];

  rankPercentile: number | null;

  createdAt: Date;

};



type TrustSnapshotClient = {

  findFirst: (args: unknown) => Promise<TrustSnapshotRow | null>;

  create: (args: unknown) => Promise<TrustSnapshotRow>;

  findMany: (args: unknown) => Promise<TrustSnapshotRow[]>;

};



@Injectable()

export class TrustRepository {

  constructor(private readonly prisma: PrismaService) {}



  private get snapshotClient(): TrustSnapshotClient | null {

    const client = this.prisma.client as Prisma.TransactionClient & {

      trustSnapshot?: TrustSnapshotClient;

    };

    return client.trustSnapshot ?? null;

  }



  isAvailable(): boolean {

    return this.snapshotClient != null;

  }



  findLatestSnapshot(entityType: TrustEntityTypeValue, entityId: string) {

    if (!this.snapshotClient) return Promise.resolve(null);

    return this.snapshotClient.findFirst({

      where: trustSnapshotWhere(entityType, entityId),

      orderBy: { snapshotDate: 'desc' },

    });

  }



  createSnapshot(input: {

    entityType: TrustEntityTypeValue;

    entityId: string;

    trustScore: number;

    factors: ArtistTrustFactors | BrandTrustFactors | AgencyTrustFactors;

    badges: string[];

    rankPercentile?: number | null;

  }) {

    if (!this.snapshotClient) return Promise.resolve(null);

    return this.snapshotClient.create({

      data: {

        id: newId(),

        entityType: input.entityType,

        entityId: input.entityId,

        snapshotDate: new Date(),

        trustScore: input.trustScore,

        factors: toInputJson(input.factors),

        badges: input.badges,

        rankPercentile: input.rankPercentile ?? null,

      },

    });

  }



  listTrustScores(entityType: TrustEntityTypeValue) {

    if (!this.snapshotClient) return Promise.resolve([] as number[]);

    return this.snapshotClient

      .findMany({

        where: { entityType },

        orderBy: { snapshotDate: 'desc' },

        take: 500,

        select: { entityId: true, trustScore: true, snapshotDate: true },

      })

      .then((rows) => {

        const latest = new Map<string, number>();

        for (const row of rows) {

          if (!latest.has(row.entityId)) latest.set(row.entityId, row.trustScore);

        }

        return [...latest.values()];

      });

  }



  async updateBrandTrustScore(brandId: string, trustScore: number) {

    const brand = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        brand?: { update: (args: unknown) => Promise<unknown> };

      }

    ).brand;

    if (!brand) return false;

    return brand

      .update({ where: { id: brandId }, data: { trustScore } })

      .then(() => true)

      .catch(() => false);

  }



  // --- Artist signal queries ---



  countArtistEvents(artistId: string) {

    return this.prisma.client.event.count({ where: { artistId } });

  }



  countArtistEventsWithAttendance(artistId: string) {

    return this.prisma.client.event.count({

      where: {

        artistId,

        participations: { some: { status: 'checked_in' } },

      },

    });

  }



  countArtistApplications(artistId: string) {

    return this.prisma.client.opportunityApplication.count({

      where: { artistId },

    });

  }



  countArtistRespondedApplications(artistId: string) {

    return this.prisma.client.opportunityApplication.count({

      where: {

        artistId,

        status: { notIn: ['saved', 'applied'] },

      },

    });

  }



  countArtistCompletedDeals(artistId: string) {

    const deal = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        deal?: { count: (args: unknown) => Promise<number> };

      }

    ).deal;

    if (!deal) return Promise.resolve(0);

    return deal.count({

      where: { artistId, status: { in: ['completed', 'paid'] } },

    });

  }



  countArtistTotalDeals(artistId: string) {

    const deal = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        deal?: { count: (args: unknown) => Promise<number> };

      }

    ).deal;

    if (!deal) return Promise.resolve(0);

    return deal.count({ where: { artistId } });

  }



  countArtistCommunityPosts(artistId: string) {

    return this.prisma.client.communityPost.count({

      where: { community: { artistId } },

    });

  }



  countArtistCommunityMemberships(artistId: string) {

    return this.prisma.client.communityMember.count({

      where: { community: { artistId }, status: 'active' },

    });

  }



  countArtistCollaborations(artistId: string) {

    const application = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        collaborationApplication?: { count: (args: unknown) => Promise<number> };

      }

    ).collaborationApplication;

    if (!application) return Promise.resolve(0);

    return application.count({

      where: {

        applicantPersonId: { not: undefined },

        status: 'accepted',

        collaboration: { artistId },

      },

    }).catch(() => 0);

  }



  countArtistFollowers(artistId: string) {

    return this.prisma.client.artistFollow.count({ where: { artistId } });

  }



  findArtist(artistId: string) {

    return this.prisma.client.artist.findUnique({

      where: { id: artistId },

      include: {

        person: { include: { profile: true } },

      },

    });

  }



  // --- Brand signal queries ---



  findBrand(brandId: string) {

    const brand = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        brand?: { findUnique: (args: unknown) => Promise<BrandRow | null> };

      }

    ).brand;

    if (!brand) return Promise.resolve(null);

    return brand.findUnique({ where: { id: brandId } });

  }



  async aggregateBrandRevenue(brandId: string) {

    const deal = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        deal?: {

          findMany: (args: unknown) => Promise<Array<{ id: string }>>;

        };

      }

    ).deal;

    const revenue = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        revenueTransaction?: {

          groupBy: (args: unknown) => Promise<Array<{ type: string; _sum: { amount: unknown } }>>;

        };

      }

    ).revenueTransaction;

    if (!deal || !revenue) return { received: 0, expected: 0 };



    const deals = await deal.findMany({

      where: { brandId },

      select: { id: true },

    });

    if (deals.length === 0) return { received: 0, expected: 0 };



    const dealIds = deals.map((d) => d.id);

    const grouped = await revenue.groupBy({

      by: ['type'],

      where: { dealId: { in: dealIds } },

      _sum: { amount: true },

    });



    let received = 0;

    let expected = 0;

    for (const row of grouped) {

      const amount = Number(row._sum.amount ?? 0);

      if (row.type === 'received') received += amount;

      if (row.type === 'expected') expected += amount;

    }

    if (expected === 0 && received > 0) expected = received;

    return { received, expected };

  }



  countBrandDeals(brandId: string, completedOnly = false) {

    const deal = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        deal?: { count: (args: unknown) => Promise<number> };

      }

    ).deal;

    if (!deal) return Promise.resolve(0);

    return deal.count({

      where: {

        brandId,

        ...(completedOnly ? { status: { in: ['completed', 'paid'] } } : {}),

      },

    });

  }



  // --- Agency signal queries ---



  findAgency(agencyId: string) {

    const agency = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        agency?: { findUnique: (args: unknown) => Promise<AgencyRow | null> };

      }

    ).agency;

    if (!agency) return Promise.resolve(null);

    return agency.findUnique({ where: { id: agencyId } });

  }



  countAgencyRoster(agencyId: string) {

    return this.prisma.client.relationship.count({

      where: {

        sourceEntityType: 'Agency',

        sourceEntityId: agencyId,

        relationshipType: 'MANAGES',

        targetEntityType: 'Artist',

      },

    });

  }



  countAgencyRosterAddedSince(agencyId: string, since: Date) {

    return this.prisma.client.relationship.count({

      where: {

        sourceEntityType: 'Agency',

        sourceEntityId: agencyId,

        relationshipType: 'MANAGES',

        targetEntityType: 'Artist',

        createdAt: { gte: since },

      },

    });

  }



  async countAgencyCompletedDeals(agencyId: string) {

    const deal = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        deal?: { count: (args: unknown) => Promise<number> };

      }

    ).deal;

    if (!deal) return 0;

    return deal.count({

      where: { agencyId, status: { in: ['completed', 'paid'] } },

    });

  }



  async countAgencyTotalDeals(agencyId: string) {

    const deal = (

      this.prisma.client as unknown as Prisma.TransactionClient & {

        deal?: { count: (args: unknown) => Promise<number> };

      }

    ).deal;

    if (!deal) return 0;

    return deal.count({ where: { agencyId } });

  }



  listArtistsForMatching(limit = 50) {

    return this.prisma.client.artist.findMany({

      take: limit,

      orderBy: { updatedAt: 'desc' },

      include: {

        person: { include: { profile: true } },

      },

    });

  }



  listOpenListingsForArtist(artistId: string, limit = 30) {

    return this.prisma.client.opportunity.findMany({

      where: {

        marketplaceVisible: true,

        status: 'open',

        OR: [{ ownerId: null }, { ownerType: 'artist', ownerId: artistId }],

      },

      include: {

        brand: { select: { id: true, name: true, trustScore: true, verified: true } },

      },

      orderBy: { updatedAt: 'desc' },

      take: limit,

    });

  }



  async computeCityCounts(city: string) {

    const [artistsCount, eventsCount, communityMembers] = await Promise.all([

      this.prisma.client.artist.count({

        where: { person: { profile: { city: { equals: city, mode: 'insensitive' } } } },

      }),

      this.prisma.client.event.count({ where: { city: { equals: city, mode: 'insensitive' } } }),

      this.prisma.client.communityMember.count({

        where: { community: { city: { equals: city, mode: 'insensitive' } } },

      }),

    ]);

    return { artistsCount, eventsCount, communityMembers, fansCount: communityMembers * 3, venuesCount: 2 };

  }



  getArtistVerificationLevel(artistId: string) {

    return this.prisma.client.artist

      .findUnique({

        where: { id: artistId },

        include: { person: { include: { profile: true } } },

      })

      .then((row) => row?.person?.profile?.verificationLevel ?? 0);

  }

}



type BrandRow = { id: string; verified: boolean; trustScore: number | null };

type AgencyRow = { id: string; trustScore?: number | null };
