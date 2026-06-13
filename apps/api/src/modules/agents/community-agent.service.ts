import {

  ForbiddenException,

  Injectable,

  Logger,

  NotFoundException,

  ServiceUnavailableException,

} from '@nestjs/common';

import { COMMUNITY_AGENT_SLUG } from '@tsc/database';

import type {

  CommunityAgentRunPayload,

  CommunityModeratorCandidate,

  CommunitySuggestionApprovePayload,

  CommunitySuggestionDismissPayload,

  CommunitySuggestionType,

  CommunitySuggestionsPayload,

} from '@tsc/types';

import {

  canManageArtist,

  isCommunityModeratorOrAbove,

  type MembershipContext,

} from '@tsc/permissions';

import type { AgentRecommendationsQuery, CommunityAgentRunInput } from '@tsc/contracts/agents';

import { ActivityService } from '../activity/activity.service';

import { AgentsRepository } from './agents.repository';

import { DecisionEngineService } from './decision-engine.service';



type ScoredCommunitySuggestion = {

  suggestionType: CommunitySuggestionType;

  title: string;

  rationale: string;

  score: number;

  confidence: number;

  priority: 'low' | 'medium' | 'high';

  metadata: Record<string, unknown>;

  reasonCodes: string[];

};



const INACTIVE_DAYS = 30;

const MODERATOR_ROLES = new Set(['Founder', 'Admin', 'Moderator']);

const TREND_TOPIC_STUBS = [

  'live sessions',

  'beat battles',

  'producer workshops',

  'vinyl swaps',

  'open mic nights',

];



@Injectable()

export class CommunityAgentService {

  private readonly logger = new Logger(CommunityAgentService.name);



  constructor(

    private readonly repository: AgentsRepository,

    private readonly decisionEngine: DecisionEngineService,

    private readonly activityService: ActivityService,

  ) {}



  async run(

    communityId: string,

    input: CommunityAgentRunInput,

    ctx: MembershipContext,

  ): Promise<CommunityAgentRunPayload> {

    this.assertAvailable();

    const community = await this.requireCommunity(communityId);

    await this.assertCanManage(communityId, ctx, community.artist?.id ?? null);



    const agent = await this.repository.ensureCommunityAgent();

    if (!agent) {

      throw new ServiceUnavailableException('Community agent unavailable');

    }



    const task = await this.repository.createTask(agent.id, {

      communityId,

      limit: input.limit,

    });



    try {

      const context = await this.buildCommunityContext(communityId, community);

      const candidates = this.scoreSuggestions(context, input.limit);

      const actorPersonId = ctx.personId ?? ctx.userId ?? null;



      const items = [];

      let decisionsCreated = 0;



      for (const suggestion of candidates) {

        const recommendation = await this.decisionEngine.recordRecommendation(

          {

            agentId: agent.id,

            title: suggestion.title,

            rationale: suggestion.rationale,

            score: suggestion.score,

            confidence: suggestion.confidence,

            status: 'active',

            metadata: {

              communityId,

              suggestionType: suggestion.suggestionType,

              priority: suggestion.priority,

              reasonCodes: suggestion.reasonCodes,

              source: 'community_agent_v1',

              ...suggestion.metadata,

            },

          },

          null,

        );



        await this.decisionEngine.recordDecision({

          agentId: agent.id,

          entityType: 'Community',

          entityId: communityId,

          decisionType: 'community_suggestion',

          payload: {

            recommendationId: recommendation.id,

            communityId,

            suggestionType: suggestion.suggestionType,

            title: suggestion.title,

            priority: suggestion.priority,

            ...suggestion.metadata,

          },

          confidence: suggestion.confidence,

          status: 'pending',

        });

        decisionsCreated += 1;

        items.push(recommendation);

      }



      if (task) {

        await this.repository.completeTask(task.id, 'completed', {

          recommendationsCreated: items.length,

          decisionsCreated,

          communityId,

          inactiveMemberCount: context.inactiveMembers.length,

        });

      }



      if (actorPersonId) {

        await this.activityService.recordInternal({

          actorPersonId,

          action: 'community_agent_suggestions_generated',

          targetType: 'Community',

          targetId: communityId,

          metadata: {

            communityId,

            agentId: agent.id,

            taskId: task?.id ?? null,

            count: items.length,

            inactiveMemberCount: context.inactiveMembers.length,

          },

          visibility: 'private',

        });

      }



      return {

        communityId,

        taskId: task?.id ?? 'stub-task',

        recommendationsCreated: items.length,

        decisionsCreated,

        inactiveMemberCount: context.inactiveMembers.length,

        moderatorCandidateCount: context.moderatorCandidates.length,

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



  async listSuggestions(

    communityId: string,

    query: AgentRecommendationsQuery,

    ctx: MembershipContext,

  ): Promise<CommunitySuggestionsPayload> {

    this.assertAvailable();

    const community = await this.requireCommunity(communityId);

    await this.assertCanManage(communityId, ctx, community.artist?.id ?? null);



    const agent = await this.repository.ensureCommunityAgent();

    const context = await this.buildCommunityContext(communityId, community);



    const [rows, lastTask] = await Promise.all([

      this.repository.listRecommendationsForCommunity(

        communityId,

        query.limit,

        query.status ?? 'active',

        COMMUNITY_AGENT_SLUG,

      ),

      agent ? this.repository.findLatestCommunityTask(agent.id) : Promise.resolve(null),

    ]);



    return {

      communityId,

      inactiveMemberCount: context.inactiveMembers.length,

      moderatorCandidates: context.moderatorCandidates,

      upcomingTrends: context.upcomingTrends,

      items: rows.map((row) => this.decisionEngine.toRecommendationSummary(row)),

      lastRunAt: lastTask?.completedAt?.toISOString() ?? null,

      updatedAt: new Date().toISOString(),

    };

  }



  async approveSuggestion(

    id: string,

    ctx: MembershipContext,

  ): Promise<CommunitySuggestionApprovePayload> {

    this.assertAvailable();



    const existing = await this.repository.findRecommendation(id);

    if (!existing) throw new NotFoundException(`Community suggestion ${id} not found`);

    if (existing.agent?.slug !== COMMUNITY_AGENT_SLUG) {

      throw new NotFoundException(`Recommendation ${id} is not a community suggestion`);

    }



    const metadata = parseMetadata(existing.metadata);

    const communityId =

      typeof metadata.communityId === 'string' ? metadata.communityId : null;

    if (!communityId) {

      throw new NotFoundException(`Community suggestion ${id} has no community target`);

    }



    const community = await this.requireCommunity(communityId);

    await this.assertCanManage(communityId, ctx, community.artist?.id ?? null);



    const decision = await this.repository.findPendingDecisionForRecommendation(id);

    const suggestionType = metadata.suggestionType as CommunitySuggestionType | undefined;

    const executedStub = this.stubExecuteSuggestion(suggestionType, metadata);



    if (decision) {

      await this.repository.updateDecisionStatus(decision.id, 'approved');

      await this.repository.updateDecisionStatus(decision.id, 'executed');

    }



    const row = await this.repository.updateRecommendationStatus(id, 'applied');

    if (!row) {

      throw new ServiceUnavailableException('AgentRecommendation model unavailable');

    }



    const actorPersonId = ctx.personId ?? ctx.userId;

    if (actorPersonId) {

      await this.activityService.recordInternal({

        actorPersonId,

        action: 'community_suggestion_approved',

        targetType: 'AgentRecommendation',

        targetId: row.id,

        metadata: {

          recommendationId: row.id,

          communityId,

          suggestionType: suggestionType ?? null,

          title: row.title,

          executedStub,

        },

        visibility: 'private',

      });

    }



    this.logger.log(

      `Community suggestion approved: id=${id} type=${suggestionType ?? 'unknown'} stub=${executedStub}`,

    );



    return {

      id: row.id,

      status: 'applied',

      decisionStatus: 'executed',

      executedStub,

      updatedAt: row.updatedAt.toISOString(),

    };

  }



  async dismissSuggestion(

    id: string,

    ctx: MembershipContext,

  ): Promise<CommunitySuggestionDismissPayload> {

    this.assertAvailable();



    const existing = await this.repository.findRecommendation(id);

    if (!existing) throw new NotFoundException(`Community suggestion ${id} not found`);

    if (existing.agent?.slug !== COMMUNITY_AGENT_SLUG) {

      throw new NotFoundException(`Recommendation ${id} is not a community suggestion`);

    }



    const metadata = parseMetadata(existing.metadata);

    const communityId =

      typeof metadata.communityId === 'string' ? metadata.communityId : null;

    if (!communityId) {

      throw new NotFoundException(`Community suggestion ${id} has no community target`);

    }



    const community = await this.requireCommunity(communityId);

    await this.assertCanManage(communityId, ctx, community.artist?.id ?? null);



    const decision = await this.repository.findPendingDecisionForRecommendation(id);

    if (decision) {

      await this.repository.updateDecisionStatus(decision.id, 'rejected');

    }



    const row = await this.repository.updateRecommendationStatus(id, 'dismissed');

    if (!row) {

      throw new ServiceUnavailableException('AgentRecommendation model unavailable');

    }



    const actorPersonId = ctx.personId ?? ctx.userId;

    if (actorPersonId) {

      await this.activityService.recordInternal({

        actorPersonId,

        action: 'community_suggestion_dismissed',

        targetType: 'AgentRecommendation',

        targetId: row.id,

        metadata: {

          recommendationId: row.id,

          communityId,

          suggestionType: metadata.suggestionType ?? null,

          title: row.title,

        },

        visibility: 'private',

      });

    }



    return {

      id: row.id,

      status: 'dismissed',

      updatedAt: row.updatedAt.toISOString(),

    };

  }



  private async buildCommunityContext(

    communityId: string,

    community: NonNullable<Awaited<ReturnType<AgentsRepository['findCommunity']>>>,

  ) {

    const since = daysAgo(INACTIVE_DAYS);

    const genres = community.genres ?? [];

    const city = community.city ?? null;



    const [members, activePersonIds, contributorGroups, audienceSnapshot, collaborations] =

      await Promise.all([

        this.repository.listCommunityMembers(communityId),

        this.repository.listActiveMemberPersonIdsSince(communityId, since),

        this.repository.listTopCommunityContributors(communityId, since, 8),

        this.repository.findLatestCommunityAudienceSnapshot(communityId),

        this.repository.listCommunityCollaborations(genres, city, 5),

      ]);



    const activeSet = new Set(activePersonIds);

    const inactiveMembers = members.filter((member) => !activeSet.has(member.personId));



    const contributorPersonIds = contributorGroups.map((group) => group.authorId);

    const personNames = await this.repository.resolvePersonNames(contributorPersonIds);



    const personById = new Map(personNames.map((person) => [person.id, person]));

    const memberByPersonId = new Map(members.map((member) => [member.personId, member]));



    const moderatorCandidates: CommunityModeratorCandidate[] = [];

    for (const group of contributorGroups) {

      const member = memberByPersonId.get(group.authorId);

      if (!member || MODERATOR_ROLES.has(member.role)) continue;



      const postCount = group._count.authorId;

      if (postCount < 5) continue;



      const person = personById.get(group.authorId);

      const lastPost = await this.repository.findPersonLastCommunityPostAt(

        group.authorId,

        communityId,

      );



      moderatorCandidates.push({

        personId: group.authorId,

        name: displayPersonName(person, group.authorId),

        postCount30d: postCount,

        contributorScore: Math.min(100, postCount * 6 + 20),

        currentRole: member.role,

        lastActiveAt: lastPost?.publishedAt?.toISOString() ?? null,

      });

    }



    const upcomingTrends = pickTrendTopics(

      contributorGroups.length,

      audienceSnapshot?.activeMembers ?? 0,

      community._count.members,

    );



    return {

      communityId,

      communityName: community.name,

      city,

      genres,

      memberCount: community._count.members,

      inactiveMembers,

      moderatorCandidates: moderatorCandidates.slice(0, 5),

      upcomingTrends,

      audienceSnapshot,

      collaborations,

      upcomingEvents: await this.repository.listUpcomingEvents(

        communityId,

        community.artist?.id ?? null,

        5,

      ),

    };

  }



  private scoreSuggestions(

    context: Awaited<ReturnType<CommunityAgentService['buildCommunityContext']>>,

    limit: number,

  ): ScoredCommunitySuggestion[] {

    const candidates: ScoredCommunitySuggestion[] = [];



    candidates.push(...this.scoreReEngageSuggestions(context));

    candidates.push(...this.scoreModeratorRecommendations(context));

    candidates.push(...this.scoreEventSuggestions(context));

    candidates.push(...this.scorePollSuggestions(context));

    candidates.push(...this.scoreCollaborationRecommendations(context));



    return candidates.sort((a, b) => b.score - a.score).slice(0, limit);

  }



  private scoreReEngageSuggestions(

    context: Awaited<ReturnType<CommunityAgentService['buildCommunityContext']>>,

  ): ScoredCommunitySuggestion[] {

    if (context.inactiveMembers.length === 0) return [];



    const sample = context.inactiveMembers.slice(0, 3);

    const inactiveRatio =

      context.memberCount > 0

        ? context.inactiveMembers.length / context.memberCount

        : 0;



    const suggestions: ScoredCommunitySuggestion[] = [

      {

        suggestionType: 're_engage_member',

        title: `Re-engage ${context.inactiveMembers.length} inactive members`,

        rationale: `${context.inactiveMembers.length} members (${Math.round(inactiveRatio * 100)}%) had no posts or activity in the last ${INACTIVE_DAYS} days. Send a win-back message or exclusive drop.`,

        score: Math.min(92, 55 + Math.round(inactiveRatio * 40)),

        confidence: Math.min(0.9, 0.6 + inactiveRatio * 0.3),

        priority: inactiveRatio >= 0.4 ? 'high' : 'medium',

        metadata: {

          communityId: context.communityId,

          inactiveCount: context.inactiveMembers.length,

          inactiveMemberIds: sample.map((member) => member.personId),

          inactiveMemberNames: sample.map((member) =>

            displayPersonName(member.person, member.personId),

          ),

        },

        reasonCodes: ['inactive_members', 'retention_risk'],

      },

    ];



    for (const member of sample.slice(0, 1)) {

      const name = displayPersonName(member.person, member.personId);

      suggestions.push({

        suggestionType: 're_engage_member',

        title: `Win back ${name}`,

        rationale: `${name} has been inactive for ${INACTIVE_DAYS}+ days — personal outreach may restore engagement.`,

        score: 62,

        confidence: 0.58,

        priority: 'medium',

        metadata: {

          communityId: context.communityId,

          personId: member.personId,

          personName: name,

        },

        reasonCodes: ['inactive_member'],

      });

    }



    return suggestions;

  }



  private scoreModeratorRecommendations(

    context: Awaited<ReturnType<CommunityAgentService['buildCommunityContext']>>,

  ): ScoredCommunitySuggestion[] {

    return context.moderatorCandidates.slice(0, 2).map((candidate) => ({

      suggestionType: 'recommend_member' as const,

      title: `Promote ${candidate.name} to Moderator`,

      rationale: `${candidate.postCount30d} posts in 30d (contributor score ${candidate.contributorScore}) — strong moderation candidate.`,

      score: Math.min(88, candidate.contributorScore),

      confidence: Math.min(0.85, 0.5 + candidate.postCount30d * 0.03),

      priority: candidate.contributorScore >= 70 ? 'high' : 'medium',

      metadata: {

        communityId: context.communityId,

        personId: candidate.personId,

        personName: candidate.name,

        currentRole: candidate.currentRole,

        postCount30d: candidate.postCount30d,

        contributorScore: candidate.contributorScore,

        promoteToRole: 'Moderator',

      },

      reasonCodes: ['high_contributor', 'moderator_candidate'],

    }));

  }



  private scoreEventSuggestions(

    context: Awaited<ReturnType<CommunityAgentService['buildCommunityContext']>>,

  ): ScoredCommunitySuggestion[] {

    const upcomingCount = context.upcomingEvents.length;

    const eventConversion = context.audienceSnapshot?.eventConversion ?? null;



    if (upcomingCount >= 2 && (eventConversion == null || eventConversion >= 15)) {

      return [];

    }



    const cityLabel = context.city ?? 'your scene';

    const trend = context.upcomingTrends[0] ?? 'community meetup';



    return [

      {

        suggestionType: 'suggest_event',

        title: `Host a ${trend} in ${cityLabel}`,

        rationale:

          upcomingCount === 0

            ? 'No upcoming community events — a live session can re-activate members and drive conversions.'

            : `Only ${upcomingCount} upcoming event(s) — trending topic "${trend}" aligns with member interests.`,

        score: upcomingCount === 0 ? 74 : 62,

        confidence: 0.65,

        priority: upcomingCount === 0 ? 'high' : 'medium',

        metadata: {

          communityId: context.communityId,

          suggestedTopic: trend,

          city: context.city,

          upcomingEventCount: upcomingCount,

          eventConversion,

        },

        reasonCodes: ['event_gap', 'trend_signal'],

      },

    ];

  }



  private scorePollSuggestions(

    context: Awaited<ReturnType<CommunityAgentService['buildCommunityContext']>>,

  ): ScoredCommunitySuggestion[] {

    const activeMembers = context.audienceSnapshot?.activeMembers ?? null;

    const memberGrowth = context.audienceSnapshot?.memberGrowth ?? null;

    const engagementDrop =

      activeMembers != null &&

      context.memberCount > 0 &&

      activeMembers / context.memberCount < 0.25;



    if (!engagementDrop && (memberGrowth == null || memberGrowth >= 0)) {

      return [];

    }



    const pollQuestion = `What should ${context.communityName} focus on next?`;

    const pollOptions = context.upcomingTrends.slice(0, 3);



    return [

      {

        suggestionType: 'create_poll',

        title: 'Create engagement poll',

        rationale:

          'Engagement or growth signals are soft — a poll surfaces member preferences without a full poll entity (metadata stub only).',

        score: engagementDrop ? 68 : 55,

        confidence: 0.55,

        priority: 'medium',

        metadata: {

          communityId: context.communityId,

          pollStub: {

            question: pollQuestion,

            options: pollOptions.length > 0 ? pollOptions : TREND_TOPIC_STUBS.slice(0, 3),

            durationDays: 7,

            entityStatus: 'metadata_only_stub',

          },

        },

        reasonCodes: ['engagement_signal', 'poll_stub'],

      },

    ];

  }



  private scoreCollaborationRecommendations(

    context: Awaited<ReturnType<CommunityAgentService['buildCommunityContext']>>,

  ): ScoredCommunitySuggestion[] {

    return context.collaborations.slice(0, 2).map((collab) => {

      const creatorName =

        collab.creator?.displayName ?? collab.creator?.name ?? 'Creator';

      return {

        suggestionType: 'recommend_member' as const,

        title: `Invite ${creatorName} to collaborate`,

        rationale: `Open collaboration "${collab.title}" matches community genres${context.city ? ` in ${context.city}` : ''}.`,

        score: 66,

        confidence: 0.62,

        priority: 'medium',

        metadata: {

          communityId: context.communityId,

          collaborationId: collab.id,

          creatorPersonId: collab.creator?.id ?? null,

          creatorName,

          city: collab.city,

        },

        reasonCodes: ['collaboration_marketplace', 'genre_city_match'],

      };

    });

  }



  private stubExecuteSuggestion(

    suggestionType: CommunitySuggestionType | undefined,

    metadata: Record<string, unknown>,

  ): string {

    switch (suggestionType) {

      case 'suggest_event':

        return `stub:event_draft_created topic=${String(metadata.suggestedTopic ?? 'community event')}`;

      case 'create_poll':

        return 'stub:poll_metadata_logged (no poll entity — metadata only)';

      case 'recommend_member':

        if (metadata.promoteToRole) {

          return `stub:moderator_promotion_intent personId=${String(metadata.personId ?? 'unknown')}`;

        }

        return `stub:collab_invite_intent collaborationId=${String(metadata.collaborationId ?? metadata.personId ?? 'unknown')}`;

      case 're_engage_member':

        return `stub:re_engagement_campaign count=${String(metadata.inactiveCount ?? 1)}`;

      default:

        return 'stub:community_suggestion_executed';

    }

  }



  private async requireCommunity(communityId: string) {

    const community = await this.repository.findCommunity(communityId);

    if (!community) throw new NotFoundException(`Community ${communityId} not found`);

    return community;

  }



  private async assertCanManage(

    communityId: string,

    ctx: MembershipContext,

    artistId?: string | null,

  ) {

    if (ctx.roles.includes('admin')) return;

    if (artistId && canManageArtist(ctx, artistId)) return;

    if (isCommunityModeratorOrAbove(ctx, communityId)) return;

    if (await this.repository.personManagesCommunity(communityId, ctx.userId)) return;

    throw new ForbiddenException('Community leader permissions required');

  }



  private assertAvailable() {

    if (!this.repository.isAvailable()) {

      throw new ServiceUnavailableException('Decision Layer models unavailable');

    }

  }

}



function daysAgo(days: number): Date {

  const date = new Date();

  date.setDate(date.getDate() - days);

  return date;

}



function displayPersonName(

  person: { displayName?: string | null; name?: string | null } | null | undefined,

  fallbackId: string,

): string {

  if (person?.displayName?.trim()) return person.displayName.trim();

  if (person?.name?.trim()) return person.name.trim();

  return fallbackId;

}



function pickTrendTopics(
  contributorCount: number,
  _activeMembers: number,
  _memberCount: number,
): string[] {
  const offset = Math.min(2, Math.floor(contributorCount / 3));

  return TREND_TOPIC_STUBS.slice(offset, offset + 3);

}



function parseMetadata(value: unknown): Record<string, unknown> {

  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return value as Record<string, unknown>;

}


