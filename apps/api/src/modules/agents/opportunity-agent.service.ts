import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { scoreArtistOpportunities } from '@tsc/analytics';
import { resolveListingType } from '@tsc/database';
import type {
  AgentRecommendationsPayload,
  OpportunityAgentRunPayload,
} from '@tsc/types';
import { canManageArtist, type MembershipContext } from '@tsc/permissions';
import type {
  AgentRecommendationsQuery,
  OpportunityAgentRunInput,
} from '@tsc/contracts/agents';
import { AgentsRepository } from './agents.repository';
import { DecisionEngineService } from './decision-engine.service';
import { OpportunityGenerationService } from './opportunity-generation.service';

@Injectable()
export class OpportunityAgentService {
  constructor(
    private readonly repository: AgentsRepository,
    private readonly decisionEngine: DecisionEngineService,
    private readonly generationService: OpportunityGenerationService,
  ) {}

  async run(
    input: OpportunityAgentRunInput,
    ctx: MembershipContext,
  ): Promise<OpportunityAgentRunPayload> {
    this.assertAvailable();
    if (!canManageArtist(ctx, input.artistId) && !ctx.roles.includes('admin')) {
      throw new ForbiddenException('Artist or admin access required');
    }

    const artist = await this.repository.findArtist(input.artistId);
    if (!artist) throw new NotFoundException(`Artist ${input.artistId} not found`);

    const agent = await this.repository.ensureOpportunityAgent();
    if (!agent) {
      throw new ServiceUnavailableException('Opportunity agent unavailable');
    }

    const task = await this.repository.createTask(agent.id, {
      artistId: input.artistId,
      limit: input.limit,
    });

    try {
      const context = await this.buildArtistContext(input.artistId, artist);
      const scored = await this.scoreOpportunities(context, input.limit);
      const generatedMatches = await this.scorePublishedGeneratedOpportunities(
        context,
        input.limit,
      );
      const allMatches = [...generatedMatches, ...scored].slice(0, input.limit);
      const actorPersonId = ctx.personId ?? ctx.userId ?? artist.personId ?? null;

      const items = [];
      for (const match of allMatches) {
        const recommendation = await this.decisionEngine.recordRecommendation(
          {
            agentId: agent.id,
            targetArtistId: input.artistId,
            targetPersonId: artist.personId ?? undefined,
            title: match.title,
            rationale: buildRationale(match.reasonCodes, context),
            score: match.score,
            confidence: match.confidence,
            status: 'active',
            metadata: {
              opportunityId: match.opportunityId,
              listingType: match.listingType,
              city: match.city,
              genre: match.genre,
              budget: match.budget,
              brandTrustScore: match.brandTrustScore,
              reasonCodes: match.reasonCodes,
              source: 'opportunity_agent_v1',
              audienceSignals: {
                superfanCount: context.superfanCount,
                communityCount: context.communityIds.length,
                cities: context.cities,
              },
            },
          },
          actorPersonId,
        );
        items.push(recommendation);
      }

      if (task) {
        await this.repository.completeTask(task.id, 'completed', {
          recommendationsCreated: items.length,
          artistId: input.artistId,
        });
      }

      return {
        artistId: input.artistId,
        taskId: task?.id ?? 'stub-task',
        recommendationsCreated: items.length,
        items,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (task) {
        await this.repository.completeTask(task.id, 'failed', {
          error: error instanceof Error ? error.message : 'unknown',
        });
      }
      throw error;
    }
  }

  async getRecommendationsForArtist(
    artistId: string,
    query: AgentRecommendationsQuery,
    ctx: MembershipContext,
  ): Promise<AgentRecommendationsPayload> {
    this.assertAvailable();
    if (!canManageArtist(ctx, artistId) && !ctx.roles.includes('admin')) {
      throw new ForbiddenException('Artist or admin access required');
    }

    const rows = await this.repository.listRecommendationsForArtist(
      artistId,
      query.limit,
      query.status,
    );

    return {
      artistId,
      personId: null,
      items: rows.map((row) => this.decisionEngine.toRecommendationSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async getRecommendationsForMe(
    ctx: MembershipContext,
    query: AgentRecommendationsQuery,
  ): Promise<AgentRecommendationsPayload> {
    this.assertAvailable();
    const personId = ctx.personId ?? ctx.userId;
    if (!personId) {
      throw new ForbiddenException('Authenticated person required');
    }

    const rows = await this.repository.listRecommendationsForPerson(
      personId,
      ctx.artistMemberships,
      query.limit,
      query.status,
    );

    return {
      artistId: ctx.artistMemberships[0] ?? null,
      personId,
      items: rows.map((row) => this.decisionEngine.toRecommendationSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  private async buildArtistContext(
    artistId: string,
    artist: NonNullable<Awaited<ReturnType<AgentsRepository['findArtist']>>>,
  ) {
    const profile = artist.person?.profile;
    const fanProfile = artist.person?.fanProfile;
    const artistGenres = profile?.genres ?? [];
    const artistCity = profile?.city ?? null;

    const cities = new Set<string>();
    if (artistCity) cities.add(artistCity);
    for (const city of fanProfile?.cities ?? []) cities.add(city);
    for (const community of artist.communities) {
      if (community.city) cities.add(community.city);
    }

    const [applications, memberships, superfanCount] = await Promise.all([
      this.repository.listArtistApplications(artistId),
      artist.personId
        ? this.repository.listCommunityMemberships(artist.personId)
        : Promise.resolve([]),
      this.repository.countArtistSuperfans(artistId),
    ]);

    for (const membership of memberships) {
      if (membership.community.city) cities.add(membership.community.city);
    }

    const appliedOpportunityIds = new Set(
      applications
        .filter((row) => row.status !== 'saved')
        .map((row) => row.opportunityId),
    );

    const communityIds = [
      ...artist.communities.map((row) => row.id),
      ...memberships.map((row) => row.community.id),
    ];

    const engagementBoost = Math.min(95, 45 + superfanCount * 3 + communityIds.length * 2);

    return {
      artistId,
      artistGenres,
      artistCity,
      cities: [...cities],
      appliedOpportunityIds,
      communityIds: [...new Set(communityIds)],
      superfanCount,
      engagementBoost,
    };
  }

  private async scoreOpportunities(
    context: Awaited<ReturnType<OpportunityAgentService['buildArtistContext']>>,
    limit: number,
  ) {
    const listings = await this.repository.listOpenOpportunities(Math.max(limit * 3, 30));

    const candidates = listings
      .filter((row) => !context.appliedOpportunityIds.has(row.id))
      .map((row) => {
        const metadata = parseMetadata(row.metadata);
        const genre =
          typeof metadata.genre === 'string'
            ? metadata.genre
            : typeof metadata.genres === 'object' &&
                Array.isArray(metadata.genres) &&
                typeof metadata.genres[0] === 'string'
              ? metadata.genres[0]
              : null;

        return {
          opportunityId: row.id,
          title: row.title,
          listingType: resolveListingType({
            listingType: row.listingType,
            category: row.category,
          }),
          city: row.city ?? null,
          genre,
          budget:
            row.value != null
              ? Number(row.value)
              : typeof metadata.budget === 'number'
                ? metadata.budget
                : null,
          brandId: row.brandId ?? null,
          brandTrustScore: row.brand?.trustScore ?? null,
          artistGenres: context.artistGenres,
          artistCity: context.artistCity,
          engagement: context.engagementBoost,
        };
      });

    return scoreArtistOpportunities(candidates, limit);
  }

  private async scorePublishedGeneratedOpportunities(
    context: Awaited<ReturnType<OpportunityAgentService['buildArtistContext']>>,
    limit: number,
  ) {
    const published = await this.generationService.listPublishedForMatching(limit * 2);
    const matches = [];

    for (const draft of published) {
      if (!draft.opportunityId) continue;
      if (context.appliedOpportunityIds.has(draft.opportunityId)) continue;

      let score = 55 + draft.confidence * 35;
      const reasonCodes: string[] = ['system_generated'];

      if (draft.city && context.cities.some((c) => c.toLowerCase() === draft.city!.toLowerCase())) {
        score += 12;
        reasonCodes.push('location_match');
      }
      if (
        draft.genre &&
        context.artistGenres.some((g) => g.toLowerCase() === draft.genre!.toLowerCase())
      ) {
        score += 15;
        reasonCodes.push('genre_match');
      }

      matches.push({
        opportunityId: draft.opportunityId,
        title: draft.title,
        listingType: draft.suggestedType === 'grant_opportunity' ? 'grant' : draft.suggestedType === 'showcase_event' ? 'festival_slot' : 'collaboration',
        city: draft.city,
        genre: draft.genre,
        budget: null,
        brandTrustScore: null,
        score: Math.min(100, Math.round(score)),
        confidence: draft.confidence,
        reasonCodes,
      });
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Decision Layer models unavailable');
    }
  }
}

function buildRationale(
  reasonCodes: string[],
  context: { superfanCount: number; communityIds: string[]; cities: string[] },
): string {
  const parts: string[] = [];

  if (reasonCodes.includes('system_generated')) {
    parts.push('System-generated opportunity from intelligence signals');
  }
  if (reasonCodes.includes('genre_match')) parts.push('Genre aligns with your profile');
  if (reasonCodes.includes('location_match')) parts.push('Location fits your audience cities');
  if (reasonCodes.includes('high_value')) parts.push('High-value opportunity');
  if (reasonCodes.includes('trusted_brand')) parts.push('Trusted brand partner');
  if (context.superfanCount > 0) {
    parts.push(`${context.superfanCount} superfans may amplify reach`);
  }
  if (context.communityIds.length > 0) {
    parts.push(`Connected via ${context.communityIds.length} communities`);
  }
  if (parts.length === 0) {
    parts.push('Explore — early fit based on marketplace signals');
  }

  return parts.join('. ') + '.';
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
