import { Injectable } from '@nestjs/common';
import type { CreditEarnReason } from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type CreditClient = {
  findUnique: (args: unknown) => Promise<CreditRow | null>;
  create: (args: unknown) => Promise<CreditRow>;
  update: (args: unknown) => Promise<CreditRow>;
};

type TransactionClient = {
  create: (args: unknown) => Promise<TransactionRow>;
  findMany: (args: unknown) => Promise<TransactionRow[]>;
  count: (args: unknown) => Promise<number>;
};

type CreditRow = {
  id: string;
  personId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: Date;
};

type TransactionRow = {
  id: string;
  personId: string;
  amount: number;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
};

@Injectable()
export class CreditsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get creditClient(): CreditClient | null {
    const client = this.prisma.client as {
      ecosystemCredit?: CreditClient;
    };
    return client.ecosystemCredit ?? null;
  }

  private get transactionClient(): TransactionClient | null {
    const client = this.prisma.client as {
      ecosystemCreditTransaction?: TransactionClient;
    };
    return client.ecosystemCreditTransaction ?? null;
  }

  isAvailable(): boolean {
    return this.creditClient != null && this.transactionClient != null;
  }

  findByPersonId(personId: string) {
    if (!this.creditClient) return Promise.resolve(null);
    return this.creditClient.findUnique({ where: { personId } });
  }

  ensureAccount(personId: string) {
    if (!this.creditClient) return Promise.resolve(null);
    return this.creditClient
      .findUnique({ where: { personId } })
      .then((existing) => {
        if (existing) return existing;
        return this.creditClient!.create({
          data: {
            id: newId(),
            personId,
            balance: 0,
            lifetimeEarned: 0,
            lifetimeSpent: 0,
          },
        });
      });
  }

  earn(input: {
    personId: string;
    amount: number;
    reason: CreditEarnReason | string;
    referenceType?: string | null;
    referenceId?: string | null;
  }) {
    if (!this.creditClient || !this.transactionClient) return Promise.resolve(null);

    return this.ensureAccount(input.personId).then(async (account) => {
      if (!account) return null;

      const updated = await this.creditClient!.update({
        where: { personId: input.personId },
        data: {
          balance: { increment: input.amount },
          lifetimeEarned: { increment: input.amount },
        },
      });

      const transaction = await this.transactionClient!.create({
        data: {
          id: newId(),
          personId: input.personId,
          amount: input.amount,
          reason: input.reason,
          referenceType: input.referenceType ?? null,
          referenceId: input.referenceId ?? null,
        },
      });

      return { account: updated, transaction };
    });
  }

  hasEarnedForReference(
    personId: string,
    reason: string,
    referenceType: string,
    referenceId: string,
  ) {
    if (!this.transactionClient) return Promise.resolve(false);
    return this.transactionClient
      .count({
        where: { personId, reason, referenceType, referenceId },
      })
      .then((count) => count > 0);
  }

  listTransactions(personId: string, limit: number) {
    if (!this.transactionClient) {
      return Promise.resolve({ rows: [] as TransactionRow[], total: 0 });
    }
    const where = { personId };
    return Promise.all([
      this.transactionClient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.transactionClient.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  spend(input: {
    personId: string;
    amount: number;
    reason: string;
    referenceType?: string | null;
    referenceId?: string | null;
  }) {
    if (!this.creditClient || !this.transactionClient) return Promise.resolve(null);

    return this.ensureAccount(input.personId).then(async (account) => {
      if (!account) return null;
      if (account.balance < input.amount) {
        return { insufficient: true as const, balance: account.balance };
      }

      const updated = await this.creditClient!.update({
        where: { personId: input.personId },
        data: {
          balance: { decrement: input.amount },
          lifetimeSpent: { increment: input.amount },
        },
      });

      const transaction = await this.transactionClient!.create({
        data: {
          id: newId(),
          personId: input.personId,
          amount: -input.amount,
          reason: input.reason,
          referenceType: input.referenceType ?? null,
          referenceId: input.referenceId ?? null,
        },
      });

      return { account: updated, transaction, insufficient: false as const };
    });
  }
}
