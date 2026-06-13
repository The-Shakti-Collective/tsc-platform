import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  isPurchaseSupportAction,
  spendScoreDeltaForSupport,
  type SupportActionStatusValue,
  type SupportActionTypeValue,
  type SupportTargetTypeValue,
} from '@tsc/database';
import type {
  RecordSupportPayload,
  SupportActionRecord,
  SupportHistoryPayload,
  TargetSupportersPayload,
} from '@tsc/types';
import type { RecordSupportInput } from '@tsc/contracts/support-action';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import { FanService } from '../fan/fan.service';
import { SupportRepository } from './support.repository';

function toSupportActionRecord(row: {
  id: string;
  supporterPersonId: string;
  targetType: string;
  targetId: string;
  actionType: string;
  amount: number | null;
  currency: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
}): SupportActionRecord {
  return {
    id: row.id,
    supporterPersonId: row.supporterPersonId,
    targetType: row.targetType as SupportTargetTypeValue,
    targetId: row.targetId,
    actionType: row.actionType as SupportActionTypeValue,
    amount: row.amount,
    currency: row.currency,
    status: row.status as SupportActionStatusValue,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class SupportService {
  constructor(
    private readonly repository: SupportRepository,
    private readonly activityService: ActivityService,
    private readonly creditsService: CreditsService,
    private readonly fanService: FanService,
  ) {}

  recordArtistSupport(
    artistId: string,
    input: RecordSupportInput,
    ctx: MembershipContext,
  ): Promise<RecordSupportPayload> {
    return this.recordSupport('Artist', artistId, input, ctx);
  }

  recordCommunitySupport(
    communityId: string,
    input: RecordSupportInput,
    ctx: MembershipContext,
  ): Promise<RecordSupportPayload> {
    return this.recordSupport('Community', communityId, input, ctx);
  }

  recordEventSupport(
    eventId: string,
    input: RecordSupportInput,
    ctx: MembershipContext,
  ): Promise<RecordSupportPayload> {
    return this.recordSupport('Event', eventId, input, ctx);
  }

  async recordFromMembershipSubscribe(
    personId: string,
    membershipId: string,
    communityId: string,
    price: number,
    currency: string,
    subscriptionId: string,
  ): Promise<RecordSupportPayload | null> {
    if (!this.repository.isAvailable()) return null;

    const ctx: MembershipContext = {
      userId: personId,
      personId,
      roles: [],
      artistMemberships: [],
      organizationMemberships: [],
    };

    return this.recordSupport(
      'Community',
      communityId,
      {
        actionType: 'buy_membership',
        amount: price,
        currency,
        status: 'recorded',
        metadata: {
          membershipId,
          subscriptionId,
          linkedFrom: 'membership-subscribe',
        },
      },
      ctx,
      { skipActivityIfLinked: true },
    );
  }

  async recordFromCommerce(
    personId: string,
    targetType: SupportTargetTypeValue,
    targetId: string,
    actionType: SupportActionTypeValue,
    amount: number,
    currency: string,
    metadata: Record<string, unknown>,
  ): Promise<RecordSupportPayload | null> {
    if (!this.repository.isAvailable()) return null;

    const ctx: MembershipContext = {
      userId: personId,
      personId,
      roles: [],
      artistMemberships: [],
      organizationMemberships: [],
    };

    return this.recordSupport(
      targetType,
      targetId,
      {
        actionType,
        amount,
        currency,
        status: 'recorded',
        metadata: {
          ...metadata,
          linkedFrom: 'commerce-purchase',
          trackOnly: true,
        },
      },
      ctx,
      { skipActivityIfLinked: true },
    );
  }

  async recordFromEventRegister(
    personId: string,
    eventId: string,
    participationId: string,
  ): Promise<RecordSupportPayload | null> {
    if (!this.repository.isAvailable()) return null;

    const ctx: MembershipContext = {
      userId: personId,
      personId,
      roles: [],
      artistMemberships: [],
      organizationMemberships: [],
    };

    return this.recordSupport(
      'Event',
      eventId,
      {
        actionType: 'buy_ticket',
        currency: 'INR',
        status: 'recorded',
        metadata: {
          participationId,
          linkedFrom: 'event-register',
          trackOnly: true,
        },
      },
      ctx,
      { skipActivityIfLinked: true },
    );
  }

  async getMySupportHistory(
    ctx: MembershipContext,
    limit = 50,
  ): Promise<SupportHistoryPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const rows = await this.repository.listBySupporter(personId, limit);
    const total = await this.repository.countBySupporter(personId);

    return {
      personId,
      items: rows.map(toSupportActionRecord),
      total,
      updatedAt: new Date().toISOString(),
    };
  }

  async getArtistSupporters(
    artistId: string,
    limit: number,
    sortBy: 'amount' | 'count',
  ): Promise<TargetSupportersPayload> {
    return this.getTargetSupporters('Artist', artistId, limit, sortBy);
  }

  async getCommunitySupporters(
    communityId: string,
    limit: number,
    sortBy: 'amount' | 'count',
  ): Promise<TargetSupportersPayload> {
    return this.getTargetSupporters('Community', communityId, limit, sortBy);
  }

  async getEventSupporters(
    eventId: string,
    limit: number,
    sortBy: 'amount' | 'count',
  ): Promise<TargetSupportersPayload> {
    return this.getTargetSupporters('Event', eventId, limit, sortBy);
  }

  private async recordSupport(
    targetType: SupportTargetTypeValue,
    targetId: string,
    input: RecordSupportInput,
    ctx: MembershipContext,
    options?: { skipActivityIfLinked?: boolean },
  ): Promise<RecordSupportPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    await this.requireTarget(targetType, targetId);
    await this.fanService.ensureFanProfileStub(personId);

    const actionType = (input.actionType ?? 'general_support') as SupportActionTypeValue;
    const row = await this.repository.createSupportAction(
      personId,
      targetType,
      targetId,
      { ...input, actionType },
    );
    if (!row) {
      throw new ServiceUnavailableException('SupportAction model unavailable');
    }

    const relationshipType = isPurchaseSupportAction(actionType)
      ? 'PURCHASED'
      : 'SUPPORTED';
    const relationship = await this.repository.upsertSupportRelationship(
      personId,
      targetType,
      targetId,
      relationshipType,
      actionType,
      row.id,
    );

    const spendScoreDelta = spendScoreDeltaForSupport(actionType, input.amount);
    await this.repository.incrementFanSpendScore(personId, spendScoreDelta);

    const linkedFrom = input.metadata?.linkedFrom;
    const shouldRecordActivity = !options?.skipActivityIfLinked || !linkedFrom;
    if (shouldRecordActivity) {
      await this.recordSupportActivity(
        personId,
        targetType,
        targetId,
        actionType,
        input,
      );
    }

    let creditsEarned: number | null = null;
    if (actionType === 'general_support') {
      const earn = await this.creditsService.earnFromGeneralSupport(
        personId,
        row.id,
      );
      creditsEarned = earn?.amount ?? null;
    }

    return {
      supportActionId: row.id,
      supporterPersonId: personId,
      targetType,
      targetId,
      actionType,
      amount: row.amount,
      currency: row.currency,
      status: row.status as SupportActionStatusValue,
      relationshipId: relationship.id,
      relationshipType,
      creditsEarned,
      spendScoreDelta,
      created: true,
      updatedAt: new Date().toISOString(),
    };
  }

  private async recordSupportActivity(
    personId: string,
    targetType: SupportTargetTypeValue,
    targetId: string,
    actionType: SupportActionTypeValue,
    input: RecordSupportInput,
  ) {
    const actionMap: Partial<
      Record<SupportTargetTypeValue, 'supported_artist' | 'supported_community' | 'supported_event'>
    > = {
      Artist: 'supported_artist',
      Community: 'supported_community',
      Event: 'supported_event',
    };
    const action = actionMap[targetType];
    if (!action) return;

    const targetMeta = await this.resolveTargetMeta(targetType, targetId);

    await this.activityService.recordInternal({
      actorPersonId: personId,
      action,
      targetType,
      targetId,
      metadata: {
        actionType,
        amount: input.amount ?? null,
        currency: input.currency ?? 'INR',
        status: input.status ?? 'recorded',
        trackOnly: true,
        ...targetMeta,
        ...(input.metadata ?? {}),
      },
      visibility: 'public',
    });
  }

  private async resolveTargetMeta(
    targetType: SupportTargetTypeValue,
    targetId: string,
  ): Promise<Record<string, unknown>> {
    if (targetType === 'Artist') {
      const artist = await this.repository.findArtist(targetId);
      return {
        artistName: artist?.displayName ?? artist?.name,
        artistSlug: artist?.slug,
      };
    }
    if (targetType === 'Community') {
      const community = await this.repository.findCommunity(targetId);
      return {
        communityName: community?.name,
        communitySlug: community?.slug,
      };
    }
    const event = await this.repository.findEvent(targetId);
    return {
      eventTitle: event?.title,
      eventSlug: event?.slug,
      artistId: event?.artistId,
    };
  }

  private async getTargetSupporters(
    targetType: SupportTargetTypeValue,
    targetId: string,
    limit: number,
    sortBy: 'amount' | 'count',
  ): Promise<TargetSupportersPayload> {
    this.assertAvailable();
    await this.requireTarget(targetType, targetId);

    const aggregates = await this.repository.aggregateSupporters(
      targetType,
      targetId,
      limit,
      sortBy,
    );
    const personIds = aggregates.map((row) => row.supporterPersonId);
    const persons = await this.repository.findPersons(personIds);
    const personMap = new Map(persons.map((row) => [row.id, row]));

    const supporters = aggregates.map((row) => {
      const person = personMap.get(row.supporterPersonId);
      const displayName =
        person?.displayName?.trim() ||
        person?.name?.trim() ||
        row.supporterPersonId;
      return {
        personId: row.supporterPersonId,
        displayName,
        slug: person?.profile?.slug ?? null,
        supportCount: row._count._all,
        totalAmount: row._sum.amount ?? 0,
        lastSupportedAt: row._max.createdAt?.toISOString() ?? new Date().toISOString(),
      };
    });

    return {
      targetType,
      targetId,
      supporters,
      total: supporters.length,
      updatedAt: new Date().toISOString(),
    };
  }

  private async requireTarget(
    targetType: SupportTargetTypeValue,
    targetId: string,
  ) {
    if (targetType === 'Artist') {
      const artist = await this.repository.findArtist(targetId);
      if (!artist) throw new NotFoundException(`Artist ${targetId} not found`);
      return artist;
    }
    if (targetType === 'Community') {
      const community = await this.repository.findCommunity(targetId);
      if (!community) {
        throw new NotFoundException(`Community ${targetId} not found`);
      }
      return community;
    }
    const event = await this.repository.findEvent(targetId);
    if (!event) throw new NotFoundException(`Event ${targetId} not found`);
    return event;
  }

  private requirePersonId(ctx: MembershipContext): string {
    const personId = ctx.personId ?? ctx.userId;
    if (!personId) {
      throw new ForbiddenException('Authenticated person required');
    }
    return personId;
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException(
        'SupportAction models not merged — apply phase8-step6.prisma migration',
      );
    }
  }
}
