import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function displayPersonName(person: {
  displayName: string | null;
  name: string | null;
  id: string;
}): string {
  return person.displayName?.trim() || person.name?.trim() || person.id;
}

@Injectable()
export class AudienceOsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, displayName: true, slug: true },
    });
  }

  findCommunity(communityId: string) {
    return this.prisma.client.community.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, slug: true, artistId: true },
    });
  }

  async aggregateArtistCityMap(artistId: string, limit: number) {
    const [followers, participations] = await Promise.all([
      this.prisma.client.artistFollow.findMany({
        where: { artistId },
        select: {
          person: {
            select: {
              fanProfile: { select: { cities: true } },
            },
          },
        },
        take: 5000,
      }),
      this.prisma.client.eventParticipation.findMany({
        where: {
          status: { in: ['registered', 'checked_in'] },
          event: { artistId },
        },
        select: {
          person: {
            select: {
              fanProfile: { select: { cities: true } },
            },
          },
        },
        take: 5000,
      }),
    ]);

    const fanByCity = new Map<string, number>();
    const eventByCity = new Map<string, number>();

    for (const row of followers) {
      for (const city of row.person.fanProfile?.cities ?? []) {
        if (!city?.trim()) continue;
        fanByCity.set(city, (fanByCity.get(city) ?? 0) + 1);
      }
    }

    for (const row of participations) {
      for (const city of row.person.fanProfile?.cities ?? []) {
        if (!city?.trim()) continue;
        eventByCity.set(city, (eventByCity.get(city) ?? 0) + 1);
      }
    }

    const cities = new Set([...fanByCity.keys(), ...eventByCity.keys()]);
    return [...cities]
      .map((city) => {
        const fanCount = fanByCity.get(city) ?? 0;
        const eventParticipationCount = eventByCity.get(city) ?? 0;
        const densityScore = round2(fanCount * 0.7 + eventParticipationCount * 1.3);
        return { city, fanCount, eventParticipationCount, densityScore };
      })
      .sort((a, b) => b.densityScore - a.densityScore)
      .slice(0, limit);
  }

  async sumArtistSupportRevenue(artistId: string) {
    const client = (this.prisma.client as unknown as {
      supportAction?: {
        aggregate: (args: unknown) => Promise<{
          _sum: { amount: number | null };
          _count: { _all: number };
        }>;
      };
    }).supportAction;

    if (!client) {
      return { total: 0, count: 0, currency: 'INR' };
    }

    const agg = await client.aggregate({
      where: {
        targetType: 'Artist',
        targetId: artistId,
        status: 'recorded',
        amount: { not: null },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });

    return {
      total: round2(Number(agg._sum.amount ?? 0)),
      count: agg._count._all,
      currency: 'INR',
    };
  }

  async sumArtistDealRevenue(artistId: string) {
    const dealClient = (this.prisma.client as unknown as {
      deal?: {
        findMany: (args: unknown) => Promise<
          Array<{ id: string; value: unknown; currency: string; status: string }>
        >;
      };
      revenueTransaction?: {
        aggregate: (args: unknown) => Promise<{ _sum: { amount: unknown } }>;
        findMany: (args: unknown) => Promise<Array<{ amount: unknown }>>;
      };
    });

    if (!dealClient.deal) {
      return { total: 0, currency: 'INR' };
    }

    const deals = await dealClient.deal.findMany({
      where: {
        artistId,
        status: { in: ['completed', 'paid'] },
      },
      select: { id: true, value: true, currency: true },
    });

    let total = 0;
    let currency = 'INR';

    if (dealClient.revenueTransaction && deals.length > 0) {
      const dealIds = deals.map((d) => d.id);
      const revenueRows = await dealClient.revenueTransaction.findMany({
        where: { dealId: { in: dealIds } },
      });
      if (revenueRows.length > 0) {
        total = revenueRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      }
    }

    if (total === 0) {
      for (const deal of deals) {
        total += Number(deal.value ?? 0);
        currency = deal.currency ?? currency;
      }
    }

    return { total: round2(total), currency };
  }

  async aggregateArtistPurchases(artistId: string) {
    const fanPurchaseClient = (this.prisma.client as unknown as {
      fanPurchase?: {
        findMany: (args: unknown) => Promise<
          Array<{ productType: string; amount: number; currency: string; productId: string }>
        >;
      };
      ticket?: { findMany: (args: unknown) => Promise<Array<{ id: string }>> };
      commerceProduct?: { findMany: (args: unknown) => Promise<Array<{ id: string }>> };
      commerceExperience?: { findMany: (args: unknown) => Promise<Array<{ id: string }>> };
    }).fanPurchase;

    const empty = {
      tickets: { count: 0, revenue: 0 },
      merch: { count: 0, revenue: 0 },
      experiences: { count: 0, revenue: 0 },
      total: 0,
      currency: 'INR',
    };

    if (!fanPurchaseClient) return empty;

    const [events, products, experiences] = await Promise.all([
      this.prisma.client.event.findMany({
        where: { artistId },
        select: { id: true },
      }),
      (this.prisma.client as unknown as {
        commerceProduct?: { findMany: (args: unknown) => Promise<Array<{ id: string }>> };
      }).commerceProduct?.findMany({
        where: { artistId },
        select: { id: true },
      }) ?? Promise.resolve([]),
      (this.prisma.client as unknown as {
        commerceExperience?: { findMany: (args: unknown) => Promise<Array<{ id: string }>> };
      }).commerceExperience?.findMany({
        where: { artistId },
        select: { id: true },
      }) ?? Promise.resolve([]),
    ]);

    const eventIds = events.map((e) => e.id);
    const ticketIds =
      eventIds.length > 0 && (this.prisma.client as unknown as { ticket?: unknown }).ticket
        ? await (
            this.prisma.client as unknown as {
              ticket: { findMany: (args: unknown) => Promise<Array<{ id: string }>> };
            }
          ).ticket.findMany({
            where: { eventId: { in: eventIds } },
            select: { id: true },
          })
        : [];

    const productIdSet = new Set([
      ...ticketIds.map((t) => t.id),
      ...products.map((p) => p.id),
      ...experiences.map((e) => e.id),
    ]);

    if (productIdSet.size === 0) return empty;

    const purchases = await fanPurchaseClient.findMany({
      where: {
        status: 'recorded',
        productId: { in: [...productIdSet] },
      },
      select: { productType: true, amount: true, currency: true },
    });

    const breakdown = { ...empty };
    for (const purchase of purchases) {
      const amount = Number(purchase.amount ?? 0);
      breakdown.total += amount;
      breakdown.currency = purchase.currency ?? breakdown.currency;
      if (purchase.productType === 'ticket') {
        breakdown.tickets.count += 1;
        breakdown.tickets.revenue += amount;
      } else if (purchase.productType === 'merch') {
        breakdown.merch.count += 1;
        breakdown.merch.revenue += amount;
      } else if (purchase.productType === 'experience') {
        breakdown.experiences.count += 1;
        breakdown.experiences.revenue += amount;
      }
    }

    breakdown.total = round2(breakdown.total);
    breakdown.tickets.revenue = round2(breakdown.tickets.revenue);
    breakdown.merch.revenue = round2(breakdown.merch.revenue);
    breakdown.experiences.revenue = round2(breakdown.experiences.revenue);

    return breakdown;
  }

  async aggregateArtistMembership(artistId: string) {
    const membershipClient = (this.prisma.client as unknown as {
      membership?: {
        findMany: (args: unknown) => Promise<
          Array<{ id: string; price: number; currency: string }>
        >;
      };
      membershipSubscription?: {
        findMany: (args: unknown) => Promise<
          Array<{ membershipId: string; status: string }>
        >;
      };
    });

    if (!membershipClient.membership || !membershipClient.membershipSubscription) {
      return { activeSubscriptions: 0, mrrStub: 0, currency: 'INR', programsCount: 0 };
    }

    const communities = await this.prisma.client.community.findMany({
      where: { artistId },
      select: { id: true },
    });

    if (communities.length === 0) {
      return { activeSubscriptions: 0, mrrStub: 0, currency: 'INR', programsCount: 0 };
    }

    const communityIds = communities.map((c) => c.id);
    const programs = await membershipClient.membership.findMany({
      where: { communityId: { in: communityIds }, isActive: true },
      select: { id: true, price: true, currency: true },
    });

    if (programs.length === 0) {
      return { activeSubscriptions: 0, mrrStub: 0, currency: 'INR', programsCount: 0 };
    }

    const priceByProgram = new Map(programs.map((p) => [p.id, p.price]));
    const subscriptions = await membershipClient.membershipSubscription.findMany({
      where: {
        membershipId: { in: programs.map((p) => p.id) },
        status: 'active',
      },
      select: { membershipId: true },
    });

    let mrrStub = 0;
    for (const sub of subscriptions) {
      mrrStub += priceByProgram.get(sub.membershipId) ?? 0;
    }

    return {
      activeSubscriptions: subscriptions.length,
      mrrStub: round2(mrrStub),
      currency: programs[0]?.currency ?? 'INR',
      programsCount: programs.length,
    };
  }

  async listCommunityTopContributors(communityId: string, limit: number) {
    const since = daysAgo(30);
    const groups = await this.prisma.client.communityPost.groupBy({
      by: ['authorId'],
      where: { communityId, publishedAt: { gte: since } },
      _count: { authorId: true },
      orderBy: { _count: { authorId: 'desc' } },
      take: limit,
    });

    if (groups.length === 0) return [];

    const people = await this.prisma.client.person.findMany({
      where: { id: { in: groups.map((g) => g.authorId) } },
      select: { id: true, displayName: true, name: true },
    });
    const personById = new Map(people.map((p) => [p.id, p]));

    return Promise.all(
      groups.map(async (group) => {
        const lastPost = await this.prisma.client.communityPost.findFirst({
          where: { communityId, authorId: group.authorId },
          orderBy: { publishedAt: 'desc' },
          select: { publishedAt: true },
        });
        const person = personById.get(group.authorId);
        return {
          personId: group.authorId,
          name: person ? displayPersonName(person) : group.authorId,
          activityCount30d: group._count.authorId,
          lastActiveAt: lastPost?.publishedAt?.toISOString() ?? null,
        };
      }),
    );
  }

  async aggregateCommunityMembershipPrograms(communityId: string) {
    const membershipClient = (this.prisma.client as unknown as {
      membership?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            name: string;
            tier: string;
            price: number;
            currency: string;
          }>
        >;
      };
      membershipSubscription?: {
        findMany: (args: unknown) => Promise<
          Array<{ membershipId: string; status: string }>
        >;
      };
    });

    if (!membershipClient.membership || !membershipClient.membershipSubscription) {
      return [];
    }

    const programs = await membershipClient.membership.findMany({
      where: { communityId },
      orderBy: [{ isActive: 'desc' }, { price: 'asc' }],
      select: { id: true, name: true, tier: true, price: true, currency: true },
    });

    if (programs.length === 0) return [];

    const subscriptions = await membershipClient.membershipSubscription.findMany({
      where: {
        membershipId: { in: programs.map((p) => p.id) },
        status: 'active',
      },
      select: { membershipId: true },
    });

    const countByProgram = new Map<string, number>();
    for (const sub of subscriptions) {
      countByProgram.set(sub.membershipId, (countByProgram.get(sub.membershipId) ?? 0) + 1);
    }

    return programs.map((program) => {
      const activeSubscriptions = countByProgram.get(program.id) ?? 0;
      return {
        programId: program.id,
        name: program.name,
        tier: program.tier,
        price: program.price,
        currency: program.currency,
        activeSubscriptions,
        revenueStub: round2(activeSubscriptions * program.price),
      };
    });
  }
}
