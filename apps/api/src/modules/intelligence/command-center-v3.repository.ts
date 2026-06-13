import { Injectable } from '@nestjs/common';
import {
  DEAL_STATUS_PIPELINE,
  type DealStatusValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';

type DealAggregateRow = {
  status: string;
  _count: { _all: number };
  _sum: { value: unknown };
};

type DealClient = {
  groupBy: (args: unknown) => Promise<DealAggregateRow[]>;
  aggregate: (args: unknown) => Promise<{ _sum: { value: unknown } }>;
  count: (args: unknown) => Promise<number>;
};

type RevenueClient = {
  aggregate: (args: unknown) => Promise<{ _sum: { amount: unknown } }>;
};

type BrandClient = {
  count: (args: unknown) => Promise<number>;
};

type OpportunityClient = {
  count: (args: unknown) => Promise<number>;
};

const OPEN_PIPELINE_STATUSES: DealStatusValue[] = [
  'application',
  'discussion',
  'negotiation',
  'agreement',
];

const CLOSED_STATUSES: DealStatusValue[] = ['completed', 'paid'];

@Injectable()
export class CommandCenterV3Repository {
  constructor(private readonly prisma: PrismaService) {}

  private get dealClient(): DealClient | null {
    const client = this.prisma.client as unknown as { deal?: DealClient };
    return client.deal ?? null;
  }

  private get revenueClient(): RevenueClient | null {
    const client = this.prisma.client as unknown as {
      revenueTransaction?: RevenueClient;
    };
    return client.revenueTransaction ?? null;
  }

  private get brandClient(): BrandClient | null {
    const client = this.prisma.client as unknown as { brand?: BrandClient };
    return client.brand ?? null;
  }

  private get opportunityClient(): OpportunityClient | null {
    return this.prisma.client.opportunity ?? null;
  }

  async sumOpenPipelineValue(): Promise<number> {
    if (!this.dealClient) return 0;
    const result = await this.dealClient.aggregate({
      where: { status: { in: OPEN_PIPELINE_STATUSES } },
      _sum: { value: true },
    });
    return result._sum.value ? Number(result._sum.value) : 0;
  }

  async sumClosedRevenueSince(since: Date): Promise<number> {
    if (this.revenueClient) {
      const result = await this.revenueClient.aggregate({
        where: {
          type: 'received',
          recordedAt: { gte: since },
        },
        _sum: { amount: true },
      });
      const fromRevenue = result._sum.amount ? Number(result._sum.amount) : 0;
      if (fromRevenue > 0) return fromRevenue;
    }

    if (!this.dealClient) return 0;
    const result = await this.dealClient.aggregate({
      where: {
        status: { in: CLOSED_STATUSES },
        updatedAt: { gte: since },
      },
      _sum: { value: true },
    });
    return result._sum.value ? Number(result._sum.value) : 0;
  }

  async countActiveOpportunities(): Promise<number> {
    if (!this.opportunityClient) return 0;
    return this.opportunityClient.count({
      where: { status: { in: ['open', 'pending', 'in_progress'] } },
    });
  }

  async countOpportunitiesClosingSoon(withinDays = 7): Promise<number> {
    if (!this.opportunityClient) return 0;
    const now = new Date();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + withinDays);
    return this.opportunityClient.count({
      where: {
        status: { in: ['open', 'pending', 'in_progress'] },
        deadline: { gte: now, lte: deadline },
      },
    });
  }

  async countActiveBrands(): Promise<number> {
    if (!this.brandClient) return 0;
    return this.brandClient.count({ where: { status: 'active' } });
  }

  async countBrandsCreatedSince(since: Date): Promise<number> {
    if (!this.brandClient) return 0;
    return this.brandClient.count({
      where: { createdAt: { gte: since } },
    });
  }

  async groupDealsByStage(): Promise<Array<{ stage: DealStatusValue; count: number; value: number }>> {
    if (!this.dealClient) {
      return DEAL_STATUS_PIPELINE.map((stage) => ({ stage, count: 0, value: 0 }));
    }

    const rows = (await this.dealClient.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { value: true },
    })) as DealAggregateRow[];

    const byStatus = new Map(
      rows.map((row) => [
        row.status,
        {
          count: row._count._all,
          value: row._sum.value ? Number(row._sum.value) : 0,
        },
      ]),
    );

    return DEAL_STATUS_PIPELINE.map((stage) => {
      const row = byStatus.get(stage);
      return { stage, count: row?.count ?? 0, value: row?.value ?? 0 };
    });
  }

  /** Stub — artists with follower growth > 15% in last 30d when metrics exist. */
  async countHighGrowthArtists(): Promise<number> {
    const since = daysAgo(30);
    const previousStart = daysAgo(60);
    const artists = await this.prisma.client.artist.findMany({
      take: 50,
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    });

    let highGrowth = 0;
    for (const artist of artists) {
      const [current, previous] = await Promise.all([
        this.prisma.client.artistFollow.count({
          where: { artistId: artist.id, followedAt: { gte: since } },
        }),
        this.prisma.client.artistFollow.count({
          where: {
            artistId: artist.id,
            followedAt: { gte: previousStart, lt: since },
          },
        }),
      ]);
      const growth =
        previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
      if (growth > 15) highGrowth += 1;
    }
    return highGrowth;
  }

  listTopActiveBrands(limit = 5) {
    const brandClient = (this.prisma.client as unknown as {
      brand?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            name: string;
            trustScore: number | null;
            verified: boolean;
            _count?: { opportunities: number };
          }>
        >;
      };
    }).brand;

    if (!brandClient) return Promise.resolve([]);

    return brandClient.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        trustScore: true,
        verified: true,
        _count: { select: { opportunities: true } },
      },
      orderBy: [{ verified: 'desc' }, { trustScore: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  }
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
