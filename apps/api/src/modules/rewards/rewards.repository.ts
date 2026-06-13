import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { DEFAULT_REWARD_CATALOG } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { RewardRedemptionPatchInput } from '@tsc/contracts/rewards';

type RewardRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  creditCost: number;
  category: string;
  stock: number | null;
  isActive: boolean;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type RedemptionRow = {
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
  reward?: RewardRow;
};

@Injectable()
export class RewardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get rewardClient() {
    const client = this.prisma.client as unknown as {
      reward?: {
        findMany: (args: unknown) => Promise<RewardRow[]>;
        findUnique: (args: unknown) => Promise<RewardRow | null>;
        upsert: (args: unknown) => Promise<RewardRow>;
        count: (args: unknown) => Promise<number>;
        update: (args: unknown) => Promise<RewardRow>;
      };
      rewardRedemption?: {
        create: (args: unknown) => Promise<RedemptionRow>;
        findMany: (args: unknown) => Promise<RedemptionRow[]>;
        findUnique: (args: unknown) => Promise<RedemptionRow | null>;
        update: (args: unknown) => Promise<RedemptionRow>;
        count: (args: unknown) => Promise<number>;
      };
    };
    return client.reward ?? null;
  }

  private get redemptionClient() {
    const client = this.prisma.client as unknown as {
      rewardRedemption?: {
        create: (args: unknown) => Promise<RedemptionRow>;
        findMany: (args: unknown) => Promise<RedemptionRow[]>;
        findUnique: (args: unknown) => Promise<RedemptionRow | null>;
        update: (args: unknown) => Promise<RedemptionRow>;
        count: (args: unknown) => Promise<number>;
      };
    };
    return client.rewardRedemption ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.rewardClient && this.redemptionClient);
  }

  async ensureDefaultCatalog() {
    if (!this.rewardClient) return;
    for (const seed of DEFAULT_REWARD_CATALOG) {
      await this.rewardClient.upsert({
        where: { slug: seed.slug },
        create: {
          id: seed.id,
          slug: seed.slug,
          name: seed.name,
          description: seed.description,
          creditCost: seed.creditCost,
          category: seed.category,
          stock: seed.stock,
          isActive: true,
          metadata: toInputJson(seed.metadata),
        },
        update: {},
      });
    }
  }

  listRewards(activeOnly: boolean, category?: string) {
    if (!this.rewardClient) return Promise.resolve([] as RewardRow[]);
    const where: Record<string, unknown> = {};
    if (activeOnly) where.isActive = true;
    if (category) where.category = category;
    return this.rewardClient.findMany({
      where,
      orderBy: [{ category: 'asc' }, { creditCost: 'asc' }, { name: 'asc' }],
    });
  }

  findReward(id: string) {
    if (!this.rewardClient) return Promise.resolve(null);
    return this.rewardClient.findUnique({ where: { id } });
  }

  decrementStock(rewardId: string) {
    if (!this.rewardClient) return Promise.resolve(null);
    return this.rewardClient.update({
      where: { id: rewardId },
      data: { stock: { decrement: 1 } },
    });
  }

  createRedemption(rewardId: string, personId: string, creditCost: number) {
    if (!this.redemptionClient) return Promise.resolve(null);
    return this.redemptionClient.create({
      data: {
        id: newId(),
        rewardId,
        personId,
        creditCost,
        status: 'pending',
        redeemedAt: new Date(),
      },
    });
  }

  listRedemptionsForPerson(personId: string) {
    if (!this.redemptionClient) return Promise.resolve([] as RedemptionRow[]);
    return this.redemptionClient.findMany({
      where: { personId },
      include: { reward: true },
      orderBy: { redeemedAt: 'desc' },
    });
  }

  findRedemption(id: string) {
    if (!this.redemptionClient) return Promise.resolve(null);
    return this.redemptionClient.findUnique({
      where: { id },
      include: { reward: true },
    });
  }

  patchRedemption(id: string, input: RewardRedemptionPatchInput) {
    if (!this.redemptionClient) return Promise.resolve(null);
    const data: Record<string, unknown> = {};
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === 'fulfilled') {
        data.fulfilledAt = new Date();
      }
    }
    if (input.notes !== undefined) data.notes = input.notes;
    return this.redemptionClient.update({ where: { id }, data });
  }

  hasRedeemedToday(personId: string, rewardId: string) {
    if (!this.redemptionClient) return Promise.resolve(false);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.redemptionClient
      .count({
        where: {
          personId,
          rewardId,
          status: { not: 'cancelled' },
          redeemedAt: { gte: startOfDay },
        },
      })
      .then((count) => count > 0);
  }
}
