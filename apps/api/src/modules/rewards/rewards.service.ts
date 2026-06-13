import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  RewardCategoryValue,
  RewardRedemptionStatusValue,
} from '@tsc/database';
import type {
  MyRewardRedemptionsPayload,
  RewardCatalogPayload,
  RewardRecord,
  RewardRedeemPayload,
  RewardRedemptionPatchPayload,
  RewardRedemptionWithReward,
} from '@tsc/types';
import type { RewardCatalogQuery, RewardRedemptionPatchInput } from '@tsc/contracts/rewards';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import { FanService } from '../fan/fan.service';
import { RewardsRepository } from './rewards.repository';

function toRewardRecord(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  creditCost: number;
  category: string;
  stock: number | null;
  isActive: boolean;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): RewardRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    creditCost: row.creditCost,
    category: row.category as RewardCategoryValue,
    stock: row.stock,
    isActive: row.isActive,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toRedemptionWithReward(row: {
  id: string;
  rewardId: string;
  personId: string;
  creditCost: number;
  status: string;
  redeemedAt: Date;
  fulfilledAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  reward?: Parameters<typeof toRewardRecord>[0];
}): RewardRedemptionWithReward {
  const reward = row.reward
    ? toRewardRecord(row.reward)
    : {
        id: row.rewardId,
        slug: '',
        name: 'Unknown reward',
        description: null,
        creditCost: row.creditCost,
        category: 'merch' as RewardCategoryValue,
        stock: null,
        isActive: false,
        metadata: {},
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };

  return {
    id: row.id,
    rewardId: row.rewardId,
    personId: row.personId,
    creditCost: row.creditCost,
    status: row.status as RewardRedemptionStatusValue,
    redeemedAt: row.redeemedAt.toISOString(),
    fulfilledAt: row.fulfilledAt?.toISOString() ?? null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    reward,
  };
}

@Injectable()
export class RewardsService {
  constructor(
    private readonly repository: RewardsRepository,
    private readonly creditsService: CreditsService,
    private readonly activityService: ActivityService,
    private readonly fanService: FanService,
  ) {}

  async listCatalog(query: RewardCatalogQuery): Promise<RewardCatalogPayload> {
    this.assertAvailable();
    await this.repository.ensureDefaultCatalog();
    const rows = await this.repository.listRewards(query.activeOnly, query.category);
    return {
      items: rows.map(toRewardRecord),
      total: rows.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async getReward(id: string): Promise<RewardRecord> {
    this.assertAvailable();
    await this.repository.ensureDefaultCatalog();
    const row = await this.repository.findReward(id);
    if (!row || !row.isActive) {
      throw new NotFoundException(`Reward ${id} not found`);
    }
    return toRewardRecord(row);
  }

  async redeem(rewardId: string, ctx: MembershipContext): Promise<RewardRedeemPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    await this.repository.ensureDefaultCatalog();

    const reward = await this.repository.findReward(rewardId);
    if (!reward || !reward.isActive) {
      throw new NotFoundException(`Active reward ${rewardId} not found`);
    }

    if (reward.stock != null && reward.stock <= 0) {
      throw new BadRequestException('Reward is out of stock');
    }

    const alreadyToday = await this.repository.hasRedeemedToday(personId, rewardId);
    if (alreadyToday) {
      throw new BadRequestException(
        'Already redeemed this reward today — try again tomorrow',
      );
    }

    const balance = await this.creditsService.getMyBalance(ctx);
    if (balance.balance < reward.creditCost) {
      throw new BadRequestException(
        `Insufficient credits — need ${reward.creditCost}, have ${balance.balance}`,
      );
    }

    await this.fanService.ensureFanProfileStub(personId);

    const redemption = await this.repository.createRedemption(
      rewardId,
      personId,
      reward.creditCost,
    );
    if (!redemption) {
      throw new ServiceUnavailableException('RewardRedemption model unavailable');
    }

    const spend = await this.creditsService.spendForRewardRedemption(
      personId,
      reward.creditCost,
      redemption.id,
    );
    if (!spend.ok) {
      throw new BadRequestException(
        `Insufficient credits — need ${reward.creditCost}, have ${spend.balance}`,
      );
    }

    if (reward.stock != null) {
      await this.repository.decrementStock(rewardId);
    }

    await this.activityService.recordInternal({
      actorPersonId: personId,
      action: 'redeemed_reward',
      targetType: 'Reward',
      targetId: rewardId,
      metadata: {
        rewardName: reward.name,
        rewardSlug: reward.slug,
        category: reward.category,
        creditCost: reward.creditCost,
        redemptionId: redemption.id,
      },
      visibility: 'public',
    });

    return {
      rewardId,
      personId,
      redemptionId: redemption.id,
      creditCost: reward.creditCost,
      status: redemption.status as RewardRedemptionStatusValue,
      balanceAfter: spend.balance,
      created: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async listMyRedemptions(ctx: MembershipContext): Promise<MyRewardRedemptionsPayload> {
    this.assertAvailable();
    const personId = this.requirePersonId(ctx);
    const rows = await this.repository.listRedemptionsForPerson(personId);
    return {
      personId,
      items: rows.map(toRedemptionWithReward),
      total: rows.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async patchRedemption(
    id: string,
    input: RewardRedemptionPatchInput,
    ctx: MembershipContext,
  ): Promise<RewardRedemptionPatchPayload> {
    this.assertAvailable();
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin role required');
    }

    const existing = await this.repository.findRedemption(id);
    if (!existing) {
      throw new NotFoundException(`Redemption ${id} not found`);
    }

    const updated = await this.repository.patchRedemption(id, input);
    if (!updated) {
      throw new ServiceUnavailableException('RewardRedemption model unavailable');
    }

    return {
      id: updated.id,
      status: updated.status as RewardRedemptionStatusValue,
      fulfilledAt: updated.fulfilledAt?.toISOString() ?? null,
      notes: updated.notes,
      updatedAt: new Date().toISOString(),
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
        'Reward models not merged — apply phase8-step4.prisma migration',
      );
    }
  }
}
