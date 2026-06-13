import { Injectable } from '@nestjs/common';
import { CHURN_RISK_RETENTION_THRESHOLD } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';

type AudienceHealthMetricRow = {
  audienceGrowth: number;
  audienceChurn: number;
  fanRetention: number;
};

type AudienceHealthClient = {
  findMany: (args: unknown) => Promise<AudienceHealthMetricRow[]>;
  count: (args: unknown) => Promise<number>;
};

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class CommandCenterV4Repository {
  constructor(private readonly prisma: PrismaService) {}

  private get audienceHealthClient(): AudienceHealthClient | null {
    return (this.prisma.client as unknown as { audienceHealthSnapshot?: AudienceHealthClient })
      .audienceHealthSnapshot ?? null;
  }

  /** Distinct persons with FanProfile or ArtistFollow. */
  async countTotalFans(): Promise<number> {
    const [follows, profiles] = await Promise.all([
      this.prisma.client.artistFollow.findMany({
        select: { personId: true },
        distinct: ['personId'],
      }),
      this.prisma.client.fanProfile.findMany({
        select: { personId: true },
      }),
    ]);

    const ids = new Set<string>();
    for (const row of follows) ids.add(row.personId);
    for (const row of profiles) ids.add(row.personId);
    return ids.size;
  }

  /** Fans with Activity in the last 30 days. */
  async countMonthlyActiveFans(): Promise<number> {
    const since = daysAgo(30);
    const [follows, profiles] = await Promise.all([
      this.prisma.client.artistFollow.findMany({
        select: { personId: true },
        distinct: ['personId'],
      }),
      this.prisma.client.fanProfile.findMany({
        select: { personId: true },
      }),
    ]);

    const fanIds = [
      ...new Set([...follows.map((row) => row.personId), ...profiles.map((row) => row.personId)]),
    ];
    if (fanIds.length === 0) return 0;

    const activeRows = await this.prisma.client.activity.findMany({
      where: {
        actorPersonId: { in: fanIds },
        timestamp: { gte: since },
      },
      select: { actorPersonId: true },
      distinct: ['actorPersonId'],
    });

    return activeRows.length;
  }

  /** Latest superfan tier per person — gold, platinum, legend only. */
  async countSuperfansGoldPlus(): Promise<{
    gold: number;
    platinum: number;
    legend: number;
    total: number;
  }> {
    const rows = await this.prisma.client.superfanSnapshot.findMany({
      distinct: ['personId'],
      orderBy: [{ personId: 'asc' }, { snapshotDate: 'desc' }],
      select: { tier: true },
    });

    let gold = 0;
    let platinum = 0;
    let legend = 0;
    for (const row of rows) {
      if (row.tier === 'gold') gold += 1;
      else if (row.tier === 'platinum') platinum += 1;
      else if (row.tier === 'legend') legend += 1;
    }

    return { gold, platinum, legend, total: gold + platinum + legend };
  }

  /** Platform MRR stub from active MembershipSubscription × program price. */
  async sumMembershipMrrStub(): Promise<{ mrrStub: number; activeSubscriptions: number }> {
    const memberships = await this.prisma.client.membership.findMany({
      where: { isActive: true },
      select: { id: true, price: true },
    });
    if (memberships.length === 0) return { mrrStub: 0, activeSubscriptions: 0 };

    const counts = await Promise.all(
      memberships.map((membership) =>
        this.prisma.client.membershipSubscription.count({
          where: { membershipId: membership.id, status: 'active' },
        }),
      ),
    );

    let mrrStub = 0;
    let activeSubscriptions = 0;
    memberships.forEach((membership, index) => {
      mrrStub += membership.price * counts[index];
      activeSubscriptions += counts[index];
    });

    return { mrrStub: round2(mrrStub), activeSubscriptions };
  }

  /** Average growth/churn from latest artist AudienceHealthSnapshot rows. */
  async avgAudienceHealthMetrics(): Promise<{
    avgGrowth: number;
    avgChurn: number;
    churnRiskArtistCount: number;
  }> {
    if (!this.audienceHealthClient) {
      return { avgGrowth: 0, avgChurn: 0, churnRiskArtistCount: 0 };
    }

    const snapshots = await this.audienceHealthClient.findMany({
      distinct: ['artistId'],
      orderBy: [{ artistId: 'asc' }, { snapshotDate: 'desc' }],
      select: { audienceGrowth: true, audienceChurn: true, fanRetention: true },
    });

    if (snapshots.length === 0) {
      return { avgGrowth: 0, avgChurn: 0, churnRiskArtistCount: 0 };
    }

    const avgGrowth =
      snapshots.reduce((sum, row) => sum + row.audienceGrowth, 0) / snapshots.length;
    const avgChurn =
      snapshots.reduce((sum, row) => sum + row.audienceChurn, 0) / snapshots.length;
    const churnRiskArtistCount = snapshots.filter(
      (row) => row.fanRetention < CHURN_RISK_RETENTION_THRESHOLD,
    ).length;

    return {
      avgGrowth: round2(avgGrowth),
      avgChurn: round2(avgChurn),
      churnRiskArtistCount,
    };
  }
}
