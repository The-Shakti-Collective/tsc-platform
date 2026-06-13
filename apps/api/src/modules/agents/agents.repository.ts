import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  BRAND_MATCH_AGENT_SLUG,
  CAREER_AGENT_SLUG,
  COMMUNITY_AGENT_SLUG,
  EVENT_AGENT_SLUG,
  OPPORTUNITY_AGENT_SLUG,
  TALENT_DISCOVERY_AGENT_SLUG,
  COPILOT_AGENT_SLUG,
  agentRecommendationInclude,
  type AgentDecisionStatusValue,
  type AgentRecommendationStatusValue,
  type AgentTaskStatusValue,
} from '@tsc/database';
import type {
  RecordAgentDecisionInput,
  RecordAgentRecommendationInput,
} from '@tsc/contracts/agents';
import { PrismaService } from '../../common/database/prisma.service';
import { toInputJson } from '../../common/json';

type AgentRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  config: Prisma.JsonValue;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AgentRecommendationRow = {
  id: string;
  agentId: string;
  targetPersonId: string | null;
  targetArtistId: string | null;
  title: string;
  rationale: string;
  score: number;
  confidence: number;
  status: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  agent?: {
    id: string;
    slug: string;
    name: string;
    type: string;
  };
};

type AgentDecisionRow = {
  id: string;
  agentId: string;
  entityType: string;
  entityId: string;
  decisionType: string;
  payload: Prisma.JsonValue;
  confidence: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type AgentTaskRow = {
  id: string;
  agentId: string;
  status: string;
  input: Prisma.JsonValue;
  output: Prisma.JsonValue;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get agentClient() {
    return (this.prisma.client as unknown as {
      agent?: {
        findFirst: (args: unknown) => Promise<AgentRow | null>;
        findUnique: (args: unknown) => Promise<AgentRow | null>;
        create: (args: unknown) => Promise<AgentRow>;
      };
    }).agent ?? null;
  }

  private get recommendationClient() {
    return (this.prisma.client as unknown as {
      agentRecommendation?: {
        create: (args: unknown) => Promise<AgentRecommendationRow>;
        findMany: (args: unknown) => Promise<AgentRecommendationRow[]>;
        findUnique: (args: unknown) => Promise<AgentRecommendationRow | null>;
        update: (args: unknown) => Promise<AgentRecommendationRow>;
      };
    }).agentRecommendation ?? null;
  }

  private get decisionClient() {
    return (this.prisma.client as unknown as {
      agentDecision?: {
        create: (args: unknown) => Promise<AgentDecisionRow>;
        findUnique: (args: unknown) => Promise<AgentDecisionRow | null>;
        update: (args: unknown) => Promise<AgentDecisionRow>;
      };
    }).agentDecision ?? null;
  }

  private get taskClient() {
    return (this.prisma.client as unknown as {
      agentTask?: {
        create: (args: unknown) => Promise<AgentTaskRow>;
        update: (args: unknown) => Promise<AgentTaskRow>;
      };
    }).agentTask ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.agentClient && this.recommendationClient);
  }

  async ensureOpportunityAgent(): Promise<AgentRow | null> {
    return this.ensureAgent(
      OPPORTUNITY_AGENT_SLUG,
      'Opportunity Agent',
      'opportunity',
      { version: 1, module: 'opportunity' },
    );
  }

  async ensureCareerAgent(): Promise<AgentRow | null> {
    return this.ensureAgent(CAREER_AGENT_SLUG, 'Career Agent', 'career', {
      version: 1,
      module: 'career',
    });
  }

  async ensureCommunityAgent(): Promise<AgentRow | null> {
    return this.ensureAgent(COMMUNITY_AGENT_SLUG, 'Community Agent', 'community', {
      version: 1,
      module: 'community',
    });
  }

  async ensureEventAgent(): Promise<AgentRow | null> {
    return this.ensureAgent(EVENT_AGENT_SLUG, 'Event Agent', 'event', {
      version: 1,
      module: 'event',
    });
  }

  async ensureBrandMatchAgent(): Promise<AgentRow | null> {
    return this.ensureAgent(BRAND_MATCH_AGENT_SLUG, 'Brand Match Agent', 'brand_match', {
      version: 1,
      module: 'brand_match',
    });
  }

  async ensureTalentDiscoveryAgent(): Promise<AgentRow | null> {
    return this.ensureAgent(
      TALENT_DISCOVERY_AGENT_SLUG,
      'Talent Discovery Agent',
      'talent_discovery',
      { version: 1, module: 'talent_discovery' },
    );
  }

  async ensureCopilotAgent(): Promise<AgentRow | null> {
    return this.ensureAgent(COPILOT_AGENT_SLUG, 'Ecosystem Copilot', 'copilot', {
      version: 1,
      module: 'copilot',
      llmProvider: 'stub',
    });
  }

  private async ensureAgent(
    slug: string,
    name: string,
    type: string,
    config: Record<string, unknown>,
  ): Promise<AgentRow | null> {
    if (!this.agentClient) return null;

    const existing = await this.agentClient.findFirst({ where: { slug } });
    if (existing) return existing;

    return this.agentClient.create({
      data: {
        slug,
        name,
        type,
        config: toInputJson(config),
        isActive: true,
      },
    });
  }

  findAgentById(id: string) {
    if (!this.agentClient) return Promise.resolve(null);
    return this.agentClient.findUnique({ where: { id } });
  }

  createRecommendation(input: RecordAgentRecommendationInput) {
    if (!this.recommendationClient) return Promise.resolve(null);
    return this.recommendationClient.create({
      data: {
        agentId: input.agentId,
        targetPersonId: input.targetPersonId ?? null,
        targetArtistId: input.targetArtistId ?? null,
        title: input.title,
        rationale: input.rationale,
        score: input.score,
        confidence: input.confidence,
        status: input.status ?? 'active',
        metadata: toInputJson(input.metadata ?? {}),
      },
      include: agentRecommendationInclude,
    });
  }

  listRecommendationsForArtist(
    artistId: string,
    limit: number,
    status?: AgentRecommendationStatusValue,
    agentSlug?: string,
  ) {
    if (!this.recommendationClient) return Promise.resolve([]);
    const where: Record<string, unknown> = { targetArtistId: artistId };
    if (status) where.status = status;
    if (agentSlug) where.agent = { slug: agentSlug };

    return this.recommendationClient.findMany({
      where,
      include: agentRecommendationInclude,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  listRecommendationsForCommunity(
    communityId: string,
    limit: number,
    status?: AgentRecommendationStatusValue,
    agentSlug?: string,
  ) {
    if (!this.recommendationClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {
      metadata: {
        path: ['communityId'],
        equals: communityId,
      },
    };
    if (status) where.status = status;
    if (agentSlug) where.agent = { slug: agentSlug };

    return this.recommendationClient.findMany({
      where,
      include: agentRecommendationInclude,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  listRecommendationsForEvent(
    eventId: string,
    limit: number,
    status?: AgentRecommendationStatusValue,
    agentSlug?: string,
  ) {
    if (!this.recommendationClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {
      metadata: {
        path: ['eventId'],
        equals: eventId,
      },
    };
    if (status) where.status = status;
    if (agentSlug) where.agent = { slug: agentSlug };

    return this.recommendationClient.findMany({
      where,
      include: agentRecommendationInclude,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  listRecommendationsForBrand(
    brandId: string,
    limit: number,
    status?: AgentRecommendationStatusValue,
    agentSlug?: string,
    taskId?: string,
  ) {
    if (!this.recommendationClient) return Promise.resolve([]);
    const and: Record<string, unknown>[] = [
      {
        metadata: {
          path: ['brandId'],
          equals: brandId,
        },
      },
    ];
    if (taskId) {
      and.push({
        metadata: {
          path: ['taskId'],
          equals: taskId,
        },
      });
    }

    const where: Record<string, unknown> = { AND: and };
    if (status) where.status = status;
    if (agentSlug) where.agent = { slug: agentSlug };

    return this.recommendationClient.findMany({
      where,
      include: agentRecommendationInclude,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  findRecommendation(id: string) {
    if (!this.recommendationClient) return Promise.resolve(null);
    return this.recommendationClient.findUnique({
      where: { id },
      include: agentRecommendationInclude,
    });
  }

  updateRecommendationStatus(id: string, status: AgentRecommendationStatusValue) {
    if (!this.recommendationClient) return Promise.resolve(null);
    return this.recommendationClient.update({
      where: { id },
      data: { status },
      include: agentRecommendationInclude,
    });
  }

  listRecommendationsForPerson(
    personId: string,
    artistIds: string[],
    limit: number,
    status?: AgentRecommendationStatusValue,
  ) {
    if (!this.recommendationClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {
      OR: [
        { targetPersonId: personId },
        ...(artistIds.length > 0 ? [{ targetArtistId: { in: artistIds } }] : []),
      ],
    };
    if (status) where.status = status;

    return this.recommendationClient.findMany({
      where,
      include: agentRecommendationInclude,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  createDecision(input: RecordAgentDecisionInput) {
    if (!this.decisionClient) return Promise.resolve(null);
    return this.decisionClient.create({
      data: {
        agentId: input.agentId,
        entityType: input.entityType,
        entityId: input.entityId,
        decisionType: input.decisionType,
        payload: toInputJson(input.payload ?? {}),
        confidence: input.confidence,
        status: input.status ?? 'pending',
      },
    });
  }

  findDecision(id: string) {
    if (!this.decisionClient) return Promise.resolve(null);
    return this.decisionClient.findUnique({ where: { id } });
  }

  updateDecisionStatus(id: string, status: AgentDecisionStatusValue) {
    if (!this.decisionClient) return Promise.resolve(null);
    return this.decisionClient.update({
      where: { id },
      data: { status },
    });
  }

  createTask(agentId: string, input: Record<string, unknown>) {
    if (!this.taskClient) return Promise.resolve(null);
    return this.taskClient.create({
      data: {
        agentId,
        status: 'running',
        input: toInputJson(input),
        startedAt: new Date(),
      },
    });
  }

  completeTask(
    id: string,
    status: AgentTaskStatusValue,
    output: Record<string, unknown>,
  ) {
    if (!this.taskClient) return Promise.resolve(null);
    return this.taskClient.update({
      where: { id },
      data: {
        status,
        output: toInputJson(output),
        completedAt: new Date(),
      },
    });
  }

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      include: {
        person: { include: { profile: true, fanProfile: true } },
        communities: { select: { id: true, name: true, city: true, genres: true } },
      },
    });
  }

  listArtistApplications(artistId: string) {
    return this.prisma.client.opportunityApplication.findMany({
      where: { artistId },
      select: { opportunityId: true, status: true },
    });
  }

  listCommunityMemberships(personId: string) {
    return this.prisma.client.communityMember.findMany({
      where: { personId, status: 'active' },
      include: {
        community: { select: { id: true, name: true, city: true, genres: true } },
      },
    });
  }

  countArtistSuperfans(artistId: string) {
    const client = (this.prisma.client as unknown as {
      superfanSnapshot?: { count: (args: unknown) => Promise<number> };
    }).superfanSnapshot;
    if (!client) return Promise.resolve(0);
    return client.count({
      where: {
        artistId,
        tier: { in: ['gold', 'platinum', 'legend'] },
      },
    });
  }

  listOpenOpportunities(limit: number) {
    return this.prisma.client.opportunity.findMany({
      where: {
        marketplaceVisible: true,
        status: 'open',
      },
      include: {
        brand: { select: { id: true, name: true, trustScore: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  findLatestAudienceHealth(artistId: string) {
    const client = (this.prisma.client as unknown as {
      audienceHealthSnapshot?: {
        findFirst: (args: unknown) => Promise<{
          audienceGrowth: number;
          fanRetention: number;
          fanConversion: number;
          metrics: unknown;
        } | null>;
      };
    }).audienceHealthSnapshot;
    if (!client) return Promise.resolve(null);
    return client.findFirst({
      where: { artistId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  findLatestReputation(entityType: string, entityId: string) {
    const client = (this.prisma.client as unknown as {
      reputationSnapshot?: {
        findFirst: (args: unknown) => Promise<{ overallScore: number } | null>;
      };
    }).reputationSnapshot;
    if (!client) return Promise.resolve(null);
    return client.findFirst({
      where: { entityType, entityId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  findLatestTrust(entityType: string, entityId: string) {
    const client = (this.prisma.client as unknown as {
      trustSnapshot?: {
        findFirst: (args: unknown) => Promise<{ trustScore: number } | null>;
      };
    }).trustSnapshot;
    if (!client) return Promise.resolve(null);
    return client.findFirst({
      where: { entityType, entityId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  sumArtistRevenueStub(artistId: string) {
    return Promise.all([
      this.prisma.client.deal
        .aggregate({
          where: { artistId, status: { in: ['completed', 'paid'] } },
          _sum: { value: true },
        })
        .catch(() => ({ _sum: { value: null } })),
      (this.prisma.client as unknown as {
        supportAction?: {
          aggregate: (args: unknown) => Promise<{ _sum: { amount: unknown } }>;
        };
      }).supportAction
        ?.aggregate({
          where: {
            targetType: 'Artist',
            targetId: artistId,
            status: 'recorded',
          },
          _sum: { amount: true },
        })
        .catch(() => ({ _sum: { amount: null } })) ?? Promise.resolve({ _sum: { amount: null } }),
    ]).then(([deals, support]) => {
      const dealSum = deals._sum.value ? Number(deals._sum.value) : 0;
      const supportSum = support._sum.amount ? Number(support._sum.amount) : 0;
      const total = dealSum + supportSum;
      return total > 0 ? total : null;
    });
  }

  listCollaboratedPersonIds(personId: string) {
    return this.prisma.client.relationship
      .findMany({
        where: {
          OR: [
            { sourceEntityType: 'Person', sourceEntityId: personId },
            { targetEntityType: 'Person', targetEntityId: personId },
          ],
          relationshipType: 'COLLABORATED_WITH',
          effectiveTo: null,
        },
        select: {
          sourceEntityType: true,
          sourceEntityId: true,
          targetEntityType: true,
          targetEntityId: true,
        },
        take: 200,
      })
      .then((rows) => {
        const ids = new Set<string>();
        for (const row of rows) {
          if (row.sourceEntityType === 'Person' && row.sourceEntityId !== personId) {
            ids.add(row.sourceEntityId);
          }
          if (row.targetEntityType === 'Person' && row.targetEntityId !== personId) {
            ids.add(row.targetEntityId);
          }
        }
        return [...ids];
      });
  }

  listCollaboratorArtistCandidates(
    artistId: string,
    personId: string | null,
    genres: string[],
    excludePersonIds: string[],
    limit: number,
  ) {
    const genreFilter =
      genres.length > 0
        ? { genres: { hasSome: genres.map((g) => g.toLowerCase()) } }
        : {};

    return this.prisma.client.artist.findMany({
      where: {
        id: { not: artistId },
        personId: excludePersonIds.length > 0 ? { notIn: excludePersonIds } : undefined,
        person: {
          profile: genreFilter,
        },
      },
      include: {
        person: {
          select: {
            id: true,
            displayName: true,
            name: true,
            profile: { select: { city: true, genres: true, slug: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  listOpenCollaborations(genres: string[], city: string | null, limit: number) {
    const client = (this.prisma.client as unknown as {
      collaboration?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            title: string;
            city: string | null;
            genres: string[];
            creator?: {
              id: string;
              displayName: string | null;
              name: string | null;
            };
          }>
        >;
      };
    }).collaboration;
    if (!client) return Promise.resolve([]);

    const where: Record<string, unknown> = { status: 'open' };
    if (genres.length > 0) {
      where.genres = { hasSome: genres.map((g) => g.toLowerCase()) };
    }
    if (city) {
      where.OR = [{ city: { equals: city, mode: 'insensitive' } }, { city: null }];
    }

    return client.findMany({
      where,
      include: {
        creator: { select: { id: true, displayName: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  listCommunityLaunchCandidates(city: string | null, genres: string[], limit: number) {
    return this.prisma.client.community.findMany({
      where: {
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
        ...(genres.length > 0 ? { genres: { hasSome: genres } } : {}),
      },
      select: {
        id: true,
        name: true,
        city: true,
        slug: true,
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  getCityMetrics(city: string) {
    const cityFilter = { equals: city, mode: 'insensitive' as const };
    return Promise.all([
      this.prisma.client.artistFollow.count({
        where: { artist: { events: { some: { venue: { city: cityFilter } } } } },
      }),
      this.prisma.client.event.count({
        where: { venue: { city: cityFilter }, startsAt: { gte: new Date() } },
      }),
      this.prisma.client.communityMember.count({
        where: { community: { city: cityFilter }, status: 'active' },
      }),
      this.prisma.client.artist.count({
        where: {
          OR: [
            { events: { some: { venue: { city: cityFilter } } } },
            { communities: { some: { city: cityFilter } } },
          ],
        },
      }),
    ]).then(([fansCount, eventsCount, communityMembers, artistsCount]) => ({
      city,
      fansCount,
      eventsCount,
      communityMembers,
      artistsCount,
      venuesCount: 0,
      revenue: null as number | null,
    }));
  }

  findLatestCareerTask(agentId: string) {
    return this.findLatestAgentTask(agentId);
  }

  findLatestCommunityTask(agentId: string) {
    return this.findLatestAgentTask(agentId);
  }

  findLatestEventTask(agentId: string) {
    return this.findLatestAgentTask(agentId);
  }

  findLatestBrandMatchTask(agentId: string, brandId: string) {
    return this.findLatestAgentTask(agentId, brandId);
  }

  findLatestTalentDiscoveryTask(agentId: string) {
    return this.findLatestAgentTask(agentId);
  }

  findPendingTalentDiscoveryDecision(agentId: string) {
    if (!this.decisionClient) return Promise.resolve(null);
    return (this.prisma.client as unknown as {
      agentDecision?: {
        findFirst: (args: unknown) => Promise<AgentDecisionRow | null>;
      };
    }).agentDecision?.findFirst({
      where: {
        agentId,
        entityType: 'Platform',
        entityId: 'tsc-platform',
        decisionType: 'talent_discovery_scan',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    }) ?? Promise.resolve(null);
  }

  listRecommendationsForTalentDiscovery(
    limit: number,
    status?: AgentRecommendationStatusValue,
    taskId?: string,
    entityType?: string,
  ) {
    if (!this.recommendationClient) return Promise.resolve([]);
    const and: Record<string, unknown>[] = [
      {
        metadata: {
          path: ['alertType'],
          equals: 'talent_discovery_alert',
        },
      },
    ];
    if (taskId) {
      and.push({
        metadata: {
          path: ['taskId'],
          equals: taskId,
        },
      });
    }
    if (entityType) {
      and.push({
        metadata: {
          path: ['entityType'],
          equals: entityType,
        },
      });
    }

    const where: Record<string, unknown> = {
      AND: and,
      agent: { slug: TALENT_DISCOVERY_AGENT_SLUG },
    };
    if (status) where.status = status;

    return this.recommendationClient.findMany({
      where,
      include: agentRecommendationInclude,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  listArtistsBelowHealthScore(threshold: number, limit: number) {
    const client = (this.prisma.client as unknown as {
      artistHealthSnapshot?: {
        findMany: (args: unknown) => Promise<
          Array<{
            artistId: string;
            healthScore: number;
            snapshotDate: Date;
            artist: { id: string; name: string; slug: string };
          }>
        >;
      };
    }).artistHealthSnapshot;
    if (!client) return Promise.resolve([]);
    return client.findMany({
      where: { healthScore: { lt: threshold } },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ healthScore: 'asc' }, { snapshotDate: 'desc' }],
      take: limit,
      distinct: ['artistId'],
    });
  }

  listTopGrowthArtistSnapshots(limit: number, threshold: number) {
    const client = (this.prisma.client as unknown as {
      audienceHealthSnapshot?: {
        findMany: (args: unknown) => Promise<
          Array<{
            artistId: string;
            audienceGrowth: number;
            fanRetention: number;
            metrics: unknown;
            artist: { id: string; name: string; slug: string; personId: string | null };
          }>
        >;
      };
    }).audienceHealthSnapshot;
    if (!client) return Promise.resolve([]);
    return client.findMany({
      where: { audienceGrowth: { gte: threshold } },
      include: {
        artist: { select: { id: true, name: true, slug: true, personId: true } },
      },
      orderBy: [{ audienceGrowth: 'desc' }, { fanRetention: 'desc' }],
      take: limit,
      distinct: ['artistId'],
    });
  }

  listCommunityAudienceSnapshots(limit: number) {
    const client = (this.prisma.client as unknown as {
      communityAudienceSnapshot?: {
        findMany: (args: unknown) => Promise<
          Array<{
            communityId: string;
            memberGrowth: number;
            activeMembers: number;
            fanGrowth: number;
            metrics: unknown;
            community: {
              id: string;
              name: string;
              slug: string;
              city: string | null;
              genres: string[];
              artistId: string | null;
            };
          }>
        >;
      };
    }).communityAudienceSnapshot;
    if (!client) return Promise.resolve([]);
    return client.findMany({
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            genres: true,
            artistId: true,
          },
        },
      },
      orderBy: [{ memberGrowth: 'desc' }, { fanGrowth: 'desc' }],
      take: limit,
      distinct: ['communityId'],
    });
  }

  listDistinctCommunityCities(limit = 40) {
    return this.prisma.client.community.findMany({
      where: { city: { not: null } },
      select: { city: true, genres: true },
      distinct: ['city'],
      take: limit,
    });
  }

  countEventsInCityBetween(city: string, start: Date, end: Date, genre?: string | null) {
    const cityFilter = { equals: city, mode: 'insensitive' as const };
    const where: Record<string, unknown> = {
      venue: { city: cityFilter },
      startsAt: { gte: start, lt: end },
    };
    if (genre) {
      where.OR = [
        { artist: { communities: { some: { genres: { has: genre.toLowerCase() } } } } },
        { community: { genres: { has: genre.toLowerCase() } } },
      ];
    }
    return this.prisma.client.event.count({ where });
  }

  countActivityForTargetBetween(
    targetType: string,
    targetId: string,
    start: Date,
    end: Date,
  ) {
    return this.prisma.client.activity.count({
      where: {
        targetType,
        targetId,
        timestamp: { gte: start, lt: end },
      },
    });
  }

  countSuperfanSnapshotsSince(artistId: string, since: Date, tiers?: string[]) {
    const client = (this.prisma.client as unknown as {
      superfanSnapshot?: { count: (args: unknown) => Promise<number> };
    }).superfanSnapshot;
    if (!client) return Promise.resolve(0);
    return client.count({
      where: {
        artistId,
        snapshotDate: { gte: since },
        ...(tiers ? { tier: { in: tiers } } : {}),
      },
    });
  }

  countSuperfanSnapshotsBetween(
    artistId: string,
    start: Date,
    end: Date,
    tiers?: string[],
  ) {
    const client = (this.prisma.client as unknown as {
      superfanSnapshot?: { count: (args: unknown) => Promise<number> };
    }).superfanSnapshot;
    if (!client) return Promise.resolve(0);
    return client.count({
      where: {
        artistId,
        snapshotDate: { gte: start, lt: end },
        ...(tiers ? { tier: { in: tiers } } : {}),
      },
    });
  }

  avgArtistAudienceGrowthInCity(city: string, genre?: string | null) {
    const cityFilter = { equals: city, mode: 'insensitive' as const };
    const client = (this.prisma.client as unknown as {
      audienceHealthSnapshot?: {
        findMany: (args: unknown) => Promise<Array<{ audienceGrowth: number }>>;
      };
    }).audienceHealthSnapshot;
    if (!client) return Promise.resolve(0);

    const artistWhere: Record<string, unknown> = {
      OR: [
        { events: { some: { venue: { city: cityFilter } } } },
        { communities: { some: { city: cityFilter } } },
      ],
    };
    if (genre) {
      artistWhere.communities = {
        some: { city: cityFilter, genres: { has: genre.toLowerCase() } },
      };
    }

    return this.prisma.client.artist
      .findMany({
        where: artistWhere,
        select: { id: true },
        take: 100,
      })
      .then(async (artists) => {
        if (artists.length === 0) return 0;
        const rows = await client.findMany({
          where: { artistId: { in: artists.map((a) => a.id) } },
          orderBy: { snapshotDate: 'desc' },
          distinct: ['artistId'],
        });
        if (rows.length === 0) return 0;
        return (
          Math.round(
            (rows.reduce((sum, row) => sum + row.audienceGrowth, 0) / rows.length) * 100,
          ) / 100
        );
      });
  }

  listBrandMatchTasks(agentId: string, brandId: string, limit: number) {
    const client = (this.prisma.client as unknown as {
      agentTask?: {
        findMany: (args: unknown) => Promise<AgentTaskRow[]>;
      };
    }).agentTask;
    if (!client) return Promise.resolve([]);
    return client.findMany({
      where: {
        agentId,
        status: 'completed',
        input: {
          path: ['brandId'],
          equals: brandId,
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  }

  findBrand(brandId: string) {
    return this.prisma.client.brand.findUnique({
      where: { id: brandId },
      select: { id: true, name: true, personId: true, city: true, categories: true },
    });
  }

  findPendingBrandMatchDecision(agentId: string, brandId: string) {
    if (!this.decisionClient) return Promise.resolve(null);
    return (this.prisma.client as unknown as {
      agentDecision?: {
        findFirst: (args: unknown) => Promise<AgentDecisionRow | null>;
      };
    }).agentDecision?.findFirst({
      where: {
        agentId,
        entityType: 'Brand',
        entityId: brandId,
        decisionType: 'brand_match_campaign',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    }) ?? Promise.resolve(null);
  }

  findEvent(eventId: string) {
    return this.prisma.client.event.findUnique({
      where: { id: eventId },
      include: {
        venue: { select: { id: true, name: true, city: true, capacity: true } },
        artist: { select: { id: true } },
      },
    });
  }

  private findLatestAgentTask(agentId: string, brandId?: string) {
    const client = (this.prisma.client as unknown as {
      agentTask?: {
        findFirst: (args: unknown) => Promise<AgentTaskRow | null>;
      };
    }).agentTask;
    if (!client) return Promise.resolve(null);

    const where: Record<string, unknown> = { agentId, status: 'completed' };
    if (brandId) {
      where.input = {
        path: ['brandId'],
        equals: brandId,
      };
    }

    return client.findFirst({
      where,
      orderBy: { completedAt: 'desc' },
    });
  }

  findCommunity(communityId: string) {
    return this.prisma.client.community.findUnique({
      where: { id: communityId },
      include: {
        artist: { select: { id: true } },
        _count: { select: { members: true } },
      },
    });
  }

  listCommunityMembers(communityId: string) {
    return this.prisma.client.communityMember.findMany({
      where: { communityId, status: 'active' },
      include: {
        person: {
          select: { id: true, displayName: true, name: true },
        },
      },
    });
  }

  listActiveMemberPersonIdsSince(communityId: string, since: Date) {
    return Promise.all([
      this.prisma.client.communityPost.findMany({
        where: { communityId, publishedAt: { gte: since } },
        select: { authorId: true },
        distinct: ['authorId'],
      }),
      this.prisma.client.activity.findMany({
        where: {
          targetType: 'Community',
          targetId: communityId,
          timestamp: { gte: since },
        },
        select: { actorPersonId: true },
        distinct: ['actorPersonId'],
        take: 500,
      }),
    ]).then(([posts, activities]) => {
      const ids = new Set<string>();
      for (const row of posts) ids.add(row.authorId);
      for (const row of activities) ids.add(row.actorPersonId);
      return [...ids];
    });
  }

  listTopCommunityContributors(communityId: string, since: Date, limit = 8) {
    return this.prisma.client.communityPost.groupBy({
      by: ['authorId'],
      where: { communityId, publishedAt: { gte: since } },
      _count: { authorId: true },
      orderBy: { _count: { authorId: 'desc' } },
      take: limit,
    });
  }

  findPersonLastCommunityPostAt(personId: string, communityId: string) {
    return this.prisma.client.communityPost.findFirst({
      where: { authorId: personId, communityId },
      orderBy: { publishedAt: 'desc' },
      select: { publishedAt: true },
    });
  }

  findLatestCommunityAudienceSnapshot(communityId: string) {
    const client = (this.prisma.client as unknown as {
      communityAudienceSnapshot?: {
        findFirst: (args: unknown) => Promise<{
          memberGrowth: number;
          activeMembers: number;
          fanGrowth: number;
          eventConversion: number;
          metrics: unknown;
        } | null>;
      };
    }).communityAudienceSnapshot;
    if (!client) return Promise.resolve(null);
    return client.findFirst({
      where: { communityId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  listCommunityCollaborations(genres: string[], city: string | null, limit: number) {
    return this.listOpenCollaborations(genres, city, limit);
  }

  listUpcomingEvents(communityId: string, artistId?: string | null, limit = 10) {
    const or: Array<Record<string, unknown>> = [{ communityId }];
    if (artistId) or.push({ artistId });

    return this.prisma.client.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        OR: or,
      },
      include: {
        venue: { select: { name: true, city: true } },
      },
      orderBy: { startsAt: 'asc' },
      take: limit,
    });
  }

  resolvePersonNames(personIds: string[]) {
    if (personIds.length === 0) return Promise.resolve([]);
    return this.prisma.client.person.findMany({
      where: { id: { in: personIds } },
      select: { id: true, displayName: true, name: true },
    });
  }

  findPendingDecisionForRecommendation(recommendationId: string) {
    if (!this.decisionClient) return Promise.resolve(null);
    return (this.prisma.client as unknown as {
      agentDecision?: {
        findFirst: (args: unknown) => Promise<AgentDecisionRow | null>;
      };
    }).agentDecision?.findFirst({
      where: {
        status: 'pending',
        payload: {
          path: ['recommendationId'],
          equals: recommendationId,
        },
      },
    }) ?? Promise.resolve(null);
  }

  personManagesCommunity(communityId: string, personId: string) {
    return Promise.all([
      this.prisma.client.relationship.findFirst({
        where: {
          sourceEntityType: 'Person',
          sourceEntityId: personId,
          targetEntityType: 'Community',
          targetEntityId: communityId,
          relationshipType: 'MANAGES',
        },
      }),
      this.prisma.client.communityMember.findFirst({
        where: {
          communityId,
          personId,
          role: { in: ['Founder', 'Admin'] },
          status: 'active',
        },
      }),
    ]).then(([manages, member]) => Boolean(manages || member));
  }

  async countAppliedRecommendationsForBrand(brandId: string): Promise<number> {
    if (!this.recommendationClient) return 0;
    const rows = await this.recommendationClient.findMany({
      where: {
        status: 'applied',
        metadata: {
          path: ['brandId'],
          equals: brandId,
        },
      },
      take: 100,
    });
    return rows.length;
  }
}
