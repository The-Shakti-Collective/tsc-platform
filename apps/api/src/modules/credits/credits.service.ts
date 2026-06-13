import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  creditAmountForReason,
  type CreditEarnReason,
} from '@tsc/database';
import type {
  CreditShareStubPayload,
  CreditReferStubPayload,
  EcosystemCreditBalance,
  EcosystemCreditEarnPayload,
  EcosystemCreditHistoryPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type { CreditEarnInput } from '@tsc/contracts/credits';
import { CreditsRepository } from './credits.repository';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';

@Injectable()
export class CreditsService {
  constructor(
    private readonly repository: CreditsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getMyBalance(ctx: MembershipContext): Promise<EcosystemCreditBalance> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const account = await this.repository.ensureAccount(personId);
    if (!account) {
      return {
        personId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        updatedAt: new Date().toISOString(),
      };
    }
    return this.toBalance(account);
  }

  async getMyHistory(
    ctx: MembershipContext,
    limit = 50,
  ): Promise<EcosystemCreditHistoryPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const { rows, total } = await this.repository.listTransactions(personId, limit);
    return {
      personId,
      items: rows.map((row) => ({
        id: row.id,
        personId: row.personId,
        amount: row.amount,
        reason: row.reason,
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      updatedAt: new Date().toISOString(),
    };
  }

  async earn(
    input: CreditEarnInput,
    ctx: MembershipContext,
  ): Promise<EcosystemCreditEarnPayload> {
    this.assertAvailable();
    if (!ctx.roles.includes('admin') && ctx.personId !== input.personId) {
      throw new ForbiddenException('Cannot earn credits for another person');
    }
    return this.earnInternal(input);
  }

  async earnFromEventCheckIn(personId: string, eventId: string) {
    return this.earnIdempotent(personId, 'attend_event', 'Event', eventId);
  }

  async earnFromCommunityJoin(personId: string, communityId: string) {
    return this.earnIdempotent(personId, 'join_community', 'Community', communityId);
  }

  async earnFromCollaborationAccepted(personId: string, collaborationId: string) {
    return this.earnIdempotent(
      personId,
      'complete_collaboration',
      'Collaboration',
      collaborationId,
    );
  }

  async earnFromOpportunityWon(personId: string, opportunityId: string) {
    return this.earnIdempotent(
      personId,
      'complete_opportunity',
      'Opportunity',
      opportunityId,
    );
  }

  async earnFromSuperfanPlatinum(personId: string, snapshotId: string) {
    return this.earnIdempotent(
      personId,
      'superfan_platinum',
      'SuperfanSnapshot',
      snapshotId,
    );
  }

  async earnFromMembershipSubscribe(personId: string, subscriptionId: string) {
    return this.earnIdempotent(
      personId,
      'subscribed_membership',
      'MembershipSubscription',
      subscriptionId,
    );
  }

  async earnFromGeneralSupport(personId: string, supportActionId: string) {
    return this.earnIdempotent(
      personId,
      'general_support',
      'SupportAction',
      supportActionId,
    );
  }

  async earnFromFanPurchase(personId: string, fanPurchaseId: string) {
    return this.earnIdempotent(
      personId,
      'fan_purchase',
      'FanPurchase',
      fanPurchaseId,
    );
  }

  async earnFromShareContent(personId: string, shareId: string) {
    return this.earnIdempotent(personId, 'share_content', 'ShareStub', shareId);
  }

  async earnFromReferMember(
    personId: string,
    referredPersonId: string,
    relationshipId: string,
  ) {
    return this.earnIdempotent(
      personId,
      'refer_member',
      'Relationship',
      relationshipId,
    );
  }

  async spendForRewardRedemption(
    personId: string,
    amount: number,
    redemptionId: string,
  ) {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Credit ledger unavailable');
    }
    const result = await this.repository.spend({
      personId,
      amount,
      reason: 'redeem_reward',
      referenceType: 'RewardRedemption',
      referenceId: redemptionId,
    });
    if (!result) {
      throw new ServiceUnavailableException('Credit ledger unavailable');
    }
    if (result.insufficient) {
      return { ok: false as const, balance: result.balance };
    }
    return {
      ok: true as const,
      balance: result.account.balance,
      lifetimeSpent: result.account.lifetimeSpent,
    };
  }

  async shareContentStub(ctx: MembershipContext): Promise<CreditShareStubPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const shareId = `${personId}-${new Date().toISOString().slice(0, 10)}`;
    const existing = await this.repository.hasEarnedForReference(
      personId,
      'share_content',
      'ShareStub',
      shareId,
    );
    const earn = existing ? null : await this.earnFromShareContent(personId, shareId);
    const balance = await this.getMyBalance(ctx);
    return {
      personId,
      amount: earn?.amount ?? 0,
      balance: balance.balance,
      created: !existing && earn != null,
      updatedAt: new Date().toISOString(),
    };
  }

  async referMemberStub(
    referredPersonId: string,
    ctx: MembershipContext,
  ): Promise<CreditReferStubPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    if (personId === referredPersonId) {
      throw new BadRequestException('Cannot refer yourself');
    }

    const referred = await this.prisma.client.person.findUnique({
      where: { id: referredPersonId },
      select: { id: true },
    });
    if (!referred) {
      throw new BadRequestException(`Person ${referredPersonId} not found`);
    }

    const relationship = await this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: 'Person',
            targetEntityId: referredPersonId,
            relationshipType: 'REFERRED',
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Person',
        targetEntityId: referredPersonId,
        relationshipType: 'REFERRED',
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'refer-stub' }),
      },
      update: {
        effectiveTo: null,
        metadata: toInputJson({ source: 'refer-stub' }),
      },
    });

    const existing = await this.repository.hasEarnedForReference(
      personId,
      'refer_member',
      'Relationship',
      relationship.id,
    );
    const earn = existing
      ? null
      : await this.earnFromReferMember(personId, referredPersonId, relationship.id);
    const balance = await this.getMyBalance(ctx);

    return {
      personId,
      referredPersonId,
      relationshipId: relationship.id,
      amount: earn?.amount ?? 0,
      balance: balance.balance,
      created: !existing && earn != null,
      updatedAt: new Date().toISOString(),
    };
  }

  private async earnIdempotent(
    personId: string,
    reason: CreditEarnReason,
    referenceType: string,
    referenceId: string,
  ) {
    if (!this.repository.isAvailable()) return null;
    const already = await this.repository.hasEarnedForReference(
      personId,
      reason,
      referenceType,
      referenceId,
    );
    if (already) return null;
    return this.earnInternal({ personId, reason, referenceType, referenceId });
  }

  private async earnInternal(input: CreditEarnInput): Promise<EcosystemCreditEarnPayload> {
    const amount = creditAmountForReason(input.reason);
    const result = await this.repository.earn({
      personId: input.personId,
      amount,
      reason: input.reason,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    });

    if (!result) {
      throw new ServiceUnavailableException('Credit ledger unavailable');
    }

    return {
      personId: input.personId,
      amount,
      reason: input.reason,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      balance: result.account.balance,
      lifetimeEarned: result.account.lifetimeEarned,
      createdAt: result.transaction.createdAt.toISOString(),
    };
  }

  private toBalance(row: {
    personId: string;
    balance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
    updatedAt: Date;
  }): EcosystemCreditBalance {
    return {
      personId: row.personId,
      balance: row.balance,
      lifetimeEarned: row.lifetimeEarned,
      lifetimeSpent: row.lifetimeSpent,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private requirePersonId(ctx: MembershipContext): string {
    if (!ctx.personId) {
      throw new ForbiddenException('Authenticated person required');
    }
    return ctx.personId;
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException(
        'Ecosystem credit models not merged — apply phase6.5-reputation.prisma migration',
      );
    }
  }
}
