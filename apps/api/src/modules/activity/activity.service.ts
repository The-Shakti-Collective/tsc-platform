import { Injectable, Logger } from '@nestjs/common';
import type {
  ActivityActionValue,
  ActivityVisibilityValue,
} from '@tsc/database';
import { activityActorName } from '@tsc/database';
import type {
  ActivityFeedItem,
  ActivityFeedPayload,
  ActivityRecordPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type { ActivityFeedQuery, ActivityRecordInput } from './dto';
import {
  ActivityRepository,
  type ActivityRow,
  type ActivityStubEvent,
  type RecordActivityInput,
} from './activity.repository';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly repository: ActivityRepository) {}

  async record(input: RecordActivityInput): Promise<ActivityRecordPayload | null> {
    const row = await this.repository.create(input);
    if (!row) {
      this.logger.warn(
        `Activity model unavailable — dropped ${input.action} for ${input.actorPersonId}`,
      );
      return null;
    }

    return this.toRecordPayload(row);
  }

  /** Maps Sprint 2 stub emitter events to persisted Activity rows. */
  async recordFromStub(event: ActivityStubEvent): Promise<ActivityRecordPayload | null> {
    const action = this.repository.stubTypeToAction(event.type);
    if (!action) {
      this.logger.debug(`No ActivityAction mapping for stub type ${event.type}`);
      return null;
    }

    const targetType = event.entityType;
    const targetId = event.entityId;
    const metadata: Record<string, unknown> = {
      ...(event.metadata ?? {}),
      stubType: event.type,
      targetEntityType: event.targetEntityType,
      targetEntityId: event.targetEntityId,
    };

    if (action === 'joined_community' || action === 'left_community') {
      metadata.communityId = event.entityId;
    }

    return this.record({
      actorPersonId: event.actorId,
      action,
      targetType,
      targetId,
      metadata,
    });
  }

  async recordInternal(
    input: Pick<
      ActivityRecordInput,
      'actorPersonId' | 'action' | 'targetType' | 'targetId'
    > &
      Partial<Pick<ActivityRecordInput, 'metadata' | 'visibility' | 'timestamp'>>,
  ): Promise<ActivityRecordPayload | null> {
    return this.record({
      actorPersonId: input.actorPersonId,
      action: input.action as ActivityActionValue,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? {},
      visibility: (input.visibility ?? 'public') as ActivityVisibilityValue,
      timestamp: input.timestamp ? new Date(input.timestamp) : undefined,
    });
  }

  async getPersonalizedFeed(
    ctx: MembershipContext,
    query: ActivityFeedQuery,
  ): Promise<ActivityFeedPayload> {
    const personId = ctx.personId ?? ctx.userId;
    const followingIds = await this.repository.listFollowingPersonIds(personId);
    const communityIds = await this.repository.listActiveCommunityIdsForPerson(personId);

    const actorSet = new Set<string>([personId, ...followingIds]);
    const followingResult = await this.repository.listByActorIds(
      [...actorSet],
      query,
    );

    let communityRows: ActivityRow[] = [];
    if (communityIds.length > 0) {
      const communityResults = await Promise.all(
        communityIds.slice(0, 5).map((id) =>
          this.repository.listByCommunity(id, { page: 1, limit: query.limit }),
        ),
      );
      communityRows = communityResults.flatMap((r) => r.rows);
    }

    const trendingResult = await this.repository.listTrendingStub({
      page: 1,
      limit: Math.min(5, query.limit),
    });

    const merged = dedupeActivities([
      ...followingResult.rows,
      ...communityRows,
      ...trendingResult.rows,
    ]).slice(0, query.limit);

    const items = await this.enrichActivities(merged);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total: followingResult.total + communityRows.length,
      hasMore: query.page * query.limit < followingResult.total,
      sources: {
        following: followingResult.rows.length,
        communities: communityRows.length,
        trending: trendingResult.rows.length,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getPersonActivity(
    personId: string,
    query: ActivityFeedQuery,
  ): Promise<ActivityFeedPayload> {
    const { rows, total } = await this.repository.listByActor(personId, query);
    const items = await this.enrichActivities(rows);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasMore: query.page * query.limit < total,
      updatedAt: new Date().toISOString(),
    };
  }

  async getCommunityActivity(
    communityId: string,
    query: ActivityFeedQuery,
  ): Promise<ActivityFeedPayload> {
    const { rows, total } = await this.repository.listByCommunity(communityId, query);
    const items = await this.enrichActivities(rows);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasMore: query.page * query.limit < total,
      updatedAt: new Date().toISOString(),
    };
  }

  async getFollowingFeed(
    ctx: MembershipContext,
    query: ActivityFeedQuery,
  ): Promise<ActivityFeedPayload> {
    const personId = ctx.personId ?? ctx.userId;
    const followingIds = await this.repository.listFollowingPersonIds(personId);

    if (followingIds.length === 0) {
      return {
        items: [],
        page: query.page,
        limit: query.limit,
        total: 0,
        hasMore: false,
        updatedAt: new Date().toISOString(),
      };
    }

    const { rows, total } = await this.repository.listByActorIds(followingIds, query);
    const items = await this.enrichActivities(rows);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasMore: query.page * query.limit < total,
      updatedAt: new Date().toISOString(),
    };
  }

  private async enrichActivities(rows: ActivityRow[]): Promise<ActivityFeedItem[]> {
    const refs = rows.flatMap((row) => [
      { entityType: row.targetType, entityId: row.targetId },
    ]);
    const titles = await this.repository.resolveEntityTitles(refs);

    return rows.map((row) => {
      const actorName = row.actor
        ? activityActorName(row.actor)
        : row.actorPersonId;
      const actorSlug = row.actor?.profile?.slug ?? null;
      const targetTitle =
        titles.get(`${row.targetType}:${row.targetId}`) ??
        parseMetadata(row.metadata).communityName?.toString() ??
        parseMetadata(row.metadata).eventTitle?.toString() ??
        parseMetadata(row.metadata).opportunityTitle?.toString() ??
        parseMetadata(row.metadata).collaborationTitle?.toString() ??
        row.targetId;

      const metadata = parseMetadata(row.metadata);

      return {
        id: row.id,
        action: row.action as ActivityFeedItem['action'],
        actorPersonId: row.actorPersonId,
        actorName,
        actorSlug,
        targetType: row.targetType,
        targetId: row.targetId,
        targetTitle,
        metadata,
        timestamp: row.timestamp.toISOString(),
        message: formatActivityMessage(row.action, actorName, targetTitle, metadata),
        visibility: row.visibility as ActivityFeedItem['visibility'],
      };
    });
  }

  private toRecordPayload(row: ActivityRow): ActivityRecordPayload {
    return {
      id: row.id,
      actorPersonId: row.actorPersonId,
      action: row.action as ActivityRecordPayload['action'],
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: parseMetadata(row.metadata),
      timestamp: row.timestamp.toISOString(),
      visibility: row.visibility as ActivityRecordPayload['visibility'],
    };
  }
}

function dedupeActivities(rows: ActivityRow[]): ActivityRow[] {
  const seen = new Set<string>();
  const result: ActivityRow[] = [];
  for (const row of rows.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  )) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    result.push(row);
  }
  return result;
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function formatActivityMessage(
  action: string,
  actorName: string,
  targetTitle: string,
  metadata: Record<string, unknown>,
): string {
  switch (action) {
    case 'joined_community':
      return `${actorName} joined ${targetTitle}`;
    case 'left_community':
      return `${actorName} left ${targetTitle}`;
    case 'registered_event':
      return `${actorName} registered for ${targetTitle}`;
    case 'checked_in_event':
      return `${actorName} checked in at ${targetTitle}`;
    case 'applied_opportunity':
      return `${actorName} applied to ${targetTitle}`;
    case 'won_opportunity':
      return `${actorName} won ${targetTitle}`;
    case 'launched_opportunity':
      return `${actorName} launched ${targetTitle}`;
    case 'posted_collaboration':
      return `${actorName} posted a collaboration: ${targetTitle}`;
    case 'applied_collaboration':
      return `${actorName} applied to collaborate on ${targetTitle}`;
    case 'followed_person':
      return `${actorName} started following ${targetTitle}`;
    case 'followed_artist':
      return `${actorName} started following ${metadata.artistName?.toString() ?? targetTitle}`;
    case 'supported_artist':
      return `${actorName} supported ${metadata.artistName?.toString() ?? targetTitle}`;
    case 'subscribed_membership':
      return `${actorName} subscribed to ${metadata.membershipName?.toString() ?? targetTitle}`;
    case 'agent_recommendation_created':
      return `${actorName} received agent recommendation: ${metadata.title?.toString() ?? targetTitle}`;
    case 'career_actions_generated':
      return `${actorName} generated ${metadata.count?.toString() ?? 'new'} career actions`;
    case 'career_action_dismissed':
      return `${actorName} dismissed career action: ${metadata.title?.toString() ?? targetTitle}`;
    case 'community_agent_suggestions_generated':
      return `${actorName} generated ${metadata.count?.toString() ?? 'new'} community agent suggestions`;
    case 'community_suggestion_approved':
      return `${actorName} approved community suggestion: ${metadata.title?.toString() ?? targetTitle}`;
    case 'community_suggestion_dismissed':
      return `${actorName} dismissed community suggestion: ${metadata.title?.toString() ?? targetTitle}`;
    case 'forecast_generated':
      return `${actorName} generated ${metadata.forecastsCreated?.toString() ?? 'new'} ecosystem forecasts`;
    case 'insight_action_executed':
      return `${actorName} executed insight action: ${metadata.actionType?.toString() ?? targetTitle}`;
    case 'unfollowed_person':
      return `${actorName} unfollowed ${targetTitle}`;
    case 'updated_profile':
      return `${actorName} updated their profile`;
    default:
      return `${actorName} ${action.replace(/_/g, ' ')} ${targetTitle}`;
  }
}
