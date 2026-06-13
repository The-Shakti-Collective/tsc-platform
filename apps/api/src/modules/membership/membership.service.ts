import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  MembershipBenefitValue,
  MembershipProgramTierValue,
  MembershipSubscriptionStatusValue,
} from '@tsc/database';
import type {
  MembershipCancelPayload,
  MembershipProgramListPayload,
  MembershipProgramRecord,
  MembershipSubscribePayload,
  MyMembershipSubscriptionsPayload,
} from '@tsc/types';
import type {
  MembershipCreateInput,
  MembershipPatchInput,
} from '@tsc/contracts/membership-program';
import type { MembershipContext } from '@tsc/permissions';
import { canManageArtist } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import { WebhookEmitterService } from '../data-exchange/webhook-emitter.service';
import { FanService } from '../fan/fan.service';
import { SupportService } from '../support/support.service';
import { MembershipRepository } from './membership.repository';

function toProgramRecord(row: {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  tier: string;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MembershipProgramRecord {
  return {
    id: row.id,
    communityId: row.communityId,
    name: row.name,
    slug: row.slug,
    price: row.price,
    currency: row.currency,
    tier: row.tier as MembershipProgramTierValue,
    benefits: row.benefits as MembershipBenefitValue[],
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class MembershipService {
  constructor(
    private readonly repository: MembershipRepository,
    private readonly activityService: ActivityService,
    private readonly creditsService: CreditsService,
    private readonly fanService: FanService,
    private readonly supportService: SupportService,
    @Optional() private readonly webhookEmitter?: WebhookEmitterService,
  ) {}

  listCommunityPrograms(
    communityId: string,
    ctx: MembershipContext,
    activeOnly = true,
  ): Promise<MembershipProgramListPayload> {
    return this.listProgramsInternal(communityId, activeOnly);
  }

  createProgram(
    communityId: string,
    input: MembershipCreateInput,
    ctx: MembershipContext,
  ): Promise<MembershipProgramRecord> {
    return this.createProgramInternal(communityId, input, ctx);
  }

  getProgram(id: string): Promise<MembershipProgramRecord> {
    return this.getProgramInternal(id);
  }

  patchProgram(
    id: string,
    input: MembershipPatchInput,
    ctx: MembershipContext,
  ): Promise<MembershipProgramRecord> {
    return this.patchProgramInternal(id, input, ctx);
  }

  subscribe(
    membershipId: string,
    ctx: MembershipContext,
  ): Promise<MembershipSubscribePayload> {
    return this.subscribeInternal(membershipId, ctx);
  }

  cancel(
    membershipId: string,
    ctx: MembershipContext,
  ): Promise<MembershipCancelPayload> {
    return this.cancelInternal(membershipId, ctx);
  }

  listMySubscriptions(ctx: MembershipContext): Promise<MyMembershipSubscriptionsPayload> {
    return this.listMySubscriptionsInternal(ctx);
  }

  private async listProgramsInternal(
    communityId: string,
    activeOnly: boolean,
  ): Promise<MembershipProgramListPayload> {
    this.assertAvailable();
    await this.requireCommunity(communityId);

    const rows = await this.repository.listProgramsByCommunity(communityId, activeOnly);
    const items = rows.map(toProgramRecord);

    return {
      communityId,
      items,
      total: items.length,
      updatedAt: new Date().toISOString(),
    };
  }

  private async createProgramInternal(
    communityId: string,
    input: MembershipCreateInput,
    ctx: MembershipContext,
  ): Promise<MembershipProgramRecord> {
    this.assertAvailable();
    const community = await this.requireCommunity(communityId);
    await this.assertCanManage(communityId, ctx, community.artistId);

    const row = await this.repository.createProgram(communityId, input);
    if (!row) {
      throw new ServiceUnavailableException('Membership model unavailable');
    }
    return toProgramRecord(row);
  }

  private async getProgramInternal(id: string): Promise<MembershipProgramRecord> {
    this.assertAvailable();
    const row = await this.repository.findProgram(id);
    if (!row) {
      throw new NotFoundException(`Membership program ${id} not found`);
    }
    return toProgramRecord(row);
  }

  private async patchProgramInternal(
    id: string,
    input: MembershipPatchInput,
    ctx: MembershipContext,
  ): Promise<MembershipProgramRecord> {
    this.assertAvailable();
    const existing = await this.repository.findProgram(id);
    if (!existing) {
      throw new NotFoundException(`Membership program ${id} not found`);
    }

    const community = existing as typeof existing & { community?: { artistId?: string | null } };
    await this.assertCanManage(
      existing.communityId,
      ctx,
      community.community?.artistId ?? null,
    );

    const row = await this.repository.updateProgram(id, input);
    if (!row) {
      throw new ServiceUnavailableException('Membership model unavailable');
    }
    return toProgramRecord(row);
  }

  private async subscribeInternal(
    membershipId: string,
    ctx: MembershipContext,
  ): Promise<MembershipSubscribePayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const program = await this.repository.findProgram(membershipId);
    if (!program || !program.isActive) {
      throw new NotFoundException(`Active membership program ${membershipId} not found`);
    }

    await this.fanService.ensureFanProfileStub(personId);

    const existing = await this.repository.findSubscription(membershipId, personId);
    const wasActive = existing?.status === 'active';

    const subscription = await this.repository.upsertActiveSubscription(
      membershipId,
      personId,
    );
    if (!subscription) {
      throw new ServiceUnavailableException('MembershipSubscription model unavailable');
    }

    const membershipRelationship =
      await this.repository.upsertSubscribedToMembershipRelationship(
        personId,
        membershipId,
      );
    const communityRelationship =
      await this.repository.upsertSubscribedToCommunityRelationship(
        personId,
        program.communityId,
        membershipId,
      );

    const created = !wasActive;

    if (created) {
      await this.activityService.recordInternal({
        actorPersonId: personId,
        action: 'subscribed_membership',
        targetType: 'Membership',
        targetId: membershipId,
        metadata: {
          membershipName: program.name,
          membershipSlug: program.slug,
          communityId: program.communityId,
          price: program.price,
          currency: program.currency,
          trackOnly: true,
        },
        visibility: 'public',
      });

      this.webhookEmitter?.emit('membership.subscribed', {
        membershipId,
        personId,
        communityId: program.communityId,
        membershipName: program.name,
        membershipSlug: program.slug,
        price: program.price,
        currency: program.currency,
      });
    }

    let creditsEarned: number | null = null;
    if (created) {
      const earn = await this.creditsService.earnFromMembershipSubscribe(
        personId,
        subscription.id,
      );
      creditsEarned = earn?.amount ?? null;

      await this.supportService.recordFromMembershipSubscribe(
        personId,
        membershipId,
        program.communityId,
        program.price,
        program.currency,
        subscription.id,
      );
    }

    return {
      membershipId,
      personId,
      subscriptionId: subscription.id,
      status: subscription.status as MembershipSubscriptionStatusValue,
      relationshipId: membershipRelationship.id,
      communityRelationshipId: communityRelationship.id,
      created,
      creditsEarned,
      updatedAt: new Date().toISOString(),
    };
  }

  private async cancelInternal(
    membershipId: string,
    ctx: MembershipContext,
  ): Promise<MembershipCancelPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const program = await this.repository.findProgram(membershipId);
    if (!program) {
      throw new NotFoundException(`Membership program ${membershipId} not found`);
    }

    const existing = await this.repository.findSubscription(membershipId, personId);
    if (!existing || existing.status !== 'active') {
      throw new BadRequestException('No active subscription for this membership program');
    }

    const subscription = await this.repository.cancelSubscription(membershipId, personId);
    if (!subscription) {
      throw new ServiceUnavailableException('MembershipSubscription model unavailable');
    }

    await this.repository.endSubscribedRelationships(
      personId,
      membershipId,
      program.communityId,
    );

    return {
      membershipId,
      personId,
      subscriptionId: subscription.id,
      status: subscription.status as MembershipSubscriptionStatusValue,
      cancelledAt: subscription.cancelledAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private async listMySubscriptionsInternal(
    ctx: MembershipContext,
  ): Promise<MyMembershipSubscriptionsPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const rows = await this.repository.listSubscriptionsForPerson(personId, 'active');

    const items = rows
      .filter((row) => row.membership)
      .map((row) => ({
        id: row.id,
        membershipId: row.membershipId,
        personId: row.personId,
        status: row.status as MembershipSubscriptionStatusValue,
        startedAt: row.startedAt.toISOString(),
        expiresAt: row.expiresAt?.toISOString() ?? null,
        cancelledAt: row.cancelledAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        membership: toProgramRecord(row.membership!),
      }));

    return {
      personId,
      items,
      total: items.length,
      updatedAt: new Date().toISOString(),
    };
  }

  private async requireCommunity(communityId: string) {
    const community = await this.repository.findCommunity(communityId);
    if (!community) {
      throw new NotFoundException(`Community ${communityId} not found`);
    }
    return community;
  }

  private async assertCanManage(
    communityId: string,
    ctx: MembershipContext,
    artistId?: string | null,
  ) {
    if (ctx.roles.includes('admin')) return;
    if (artistId && canManageArtist(ctx, artistId)) return;
    if (await this.repository.personManagesCommunity(communityId, ctx.userId)) return;

    throw new ForbiddenException('Community leader permissions required');
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
        'Membership program models not merged — apply phase8-step3.prisma migration',
      );
    }
  }
}
