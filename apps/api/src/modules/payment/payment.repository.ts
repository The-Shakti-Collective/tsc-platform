import { Injectable } from '@nestjs/common';
import {
  invoiceInclude,
  payoutListWhere,
  type EscrowStatusValue,
  type InvoiceStatusValue,
  type PaymentProviderValue,
  type PayoutStatusValue,
  type SettlementStatusValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type InvoiceRow = {
  id: string;
  contractId: string | null;
  dealId: string | null;
  bookingRequestId: string | null;
  artistId: string;
  brandId: string | null;
  amount: unknown;
  currency: string;
  status: string;
  dueDate: Date | null;
  paidAt: Date | null;
  paymentProvider: string | null;
  createdAt: Date;
  updatedAt: Date;
  deal?: { id: string; status: string; value: unknown; currency: string; artistId: string } | null;
};

type EscrowRow = {
  id: string;
  dealId: string | null;
  contractId: string | null;
  amount: unknown;
  currency: string;
  status: string;
  provider: string;
  externalId: string | null;
  heldAt: Date | null;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PayoutRow = {
  id: string;
  artistId: string | null;
  personId: string;
  amount: unknown;
  currency: string;
  status: string;
  provider: string;
  externalId: string | null;
  scheduledAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SettlementRow = {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: unknown;
  currency: string;
  status: string;
  payoutIds: unknown;
  settledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RevenueAggregate = { type: string; _sum: { amount: unknown } };

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('invoice') != null;
  }

  findInvoiceById(id: string): Promise<InvoiceRow | null> {
    const invoice = this.client('invoice') as {
      findUnique: (args: unknown) => Promise<InvoiceRow | null>;
    } | null;
    if (!invoice) return Promise.resolve(null);
    return invoice.findUnique({ where: { id }, include: invoiceInclude });
  }

  updateInvoice(
    id: string,
    data: {
      status?: InvoiceStatusValue;
      paidAt?: Date | null;
      paymentProvider?: PaymentProviderValue | null;
      dueDate?: Date | null;
      amount?: number | null;
    },
  ): Promise<InvoiceRow | null> {
    const invoice = this.client('invoice') as {
      update: (args: unknown) => Promise<InvoiceRow>;
    } | null;
    if (!invoice) return Promise.resolve(null);
    return invoice.update({
      where: { id },
      data: {
        status: data.status,
        paidAt: data.paidAt,
        paymentProvider: data.paymentProvider,
        dueDate: data.dueDate,
        amount: data.amount,
      },
      include: invoiceInclude,
    });
  }

  findEscrowByDealId(dealId: string): Promise<EscrowRow | null> {
    const escrow = this.client('escrow') as {
      findFirst: (args: unknown) => Promise<EscrowRow | null>;
    } | null;
    if (!escrow) return Promise.resolve(null);
    return escrow.findFirst({
      where: { dealId, status: { in: ['pending', 'holding'] } },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  findEscrowById(id: string): Promise<EscrowRow | null> {
    const escrow = this.client('escrow') as {
      findUnique: (args: unknown) => Promise<EscrowRow | null>;
    } | null;
    if (!escrow) return Promise.resolve(null);
    return escrow.findUnique({ where: { id } });
  }

  createEscrow(input: {
    dealId?: string | null;
    contractId?: string | null;
    amount: number;
    currency: string;
    status: EscrowStatusValue;
    provider: PaymentProviderValue;
    externalId?: string | null;
    heldAt?: Date | null;
  }): Promise<EscrowRow | null> {
    const escrow = this.client('escrow') as {
      create: (args: unknown) => Promise<EscrowRow>;
    } | null;
    if (!escrow) return Promise.resolve(null);
    return escrow.create({
      data: {
        id: newId(),
        dealId: input.dealId ?? null,
        contractId: input.contractId ?? null,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        provider: input.provider,
        externalId: input.externalId ?? null,
        heldAt: input.heldAt ?? null,
      },
    });
  }

  updateEscrow(
    id: string,
    data: {
      status?: EscrowStatusValue;
      externalId?: string | null;
      releasedAt?: Date | null;
    },
  ): Promise<EscrowRow | null> {
    const escrow = this.client('escrow') as {
      update: (args: unknown) => Promise<EscrowRow>;
    } | null;
    if (!escrow) return Promise.resolve(null);
    return escrow.update({ where: { id }, data });
  }

  createPayout(input: {
    artistId?: string | null;
    personId: string;
    amount: number;
    currency: string;
    status: PayoutStatusValue;
    provider: PaymentProviderValue;
    externalId?: string | null;
    scheduledAt?: Date | null;
  }): Promise<PayoutRow | null> {
    const payout = this.client('payout') as {
      create: (args: unknown) => Promise<PayoutRow>;
    } | null;
    if (!payout) return Promise.resolve(null);
    return payout.create({
      data: {
        id: newId(),
        artistId: input.artistId ?? null,
        personId: input.personId,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        provider: input.provider,
        externalId: input.externalId ?? null,
        scheduledAt: input.scheduledAt ?? null,
      },
    });
  }

  listPayouts(query: {
    artistId?: string;
    personId?: string;
    status?: PayoutStatusValue;
    limit?: number;
  }): Promise<PayoutRow[]> {
    const payout = this.client('payout') as {
      findMany: (args: unknown) => Promise<PayoutRow[]>;
    } | null;
    if (!payout) return Promise.resolve([]);
    return payout.findMany({
      where: payoutListWhere(query),
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
      take: query.limit ?? 50,
    });
  }

  listSettlements(query: {
    status?: SettlementStatusValue;
    limit?: number;
  }): Promise<SettlementRow[]> {
    const settlement = this.client('settlement') as {
      findMany: (args: unknown) => Promise<SettlementRow[]>;
    } | null;
    if (!settlement) return Promise.resolve([]);
    return settlement.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: [{ periodEnd: 'desc' }],
      take: query.limit ?? 50,
    });
  }

  createSettlement(input: {
    periodStart: Date;
    periodEnd: Date;
    totalAmount: number;
    currency: string;
    status: SettlementStatusValue;
    payoutIds: string[];
  }): Promise<SettlementRow | null> {
    const settlement = this.client('settlement') as {
      create: (args: unknown) => Promise<SettlementRow>;
    } | null;
    if (!settlement) return Promise.resolve(null);
    return settlement.create({
      data: {
        id: newId(),
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        totalAmount: input.totalAmount,
        currency: input.currency,
        status: input.status,
        payoutIds: input.payoutIds,
      },
    });
  }

  async aggregateRevenue(): Promise<{ expected: number; received: number; pending: number }> {
    const revenue = this.client('revenueTransaction') as {
      groupBy: (args: unknown) => Promise<RevenueAggregate[]>;
    } | null;
    if (!revenue) return { expected: 0, received: 0, pending: 0 };

    const rows = await revenue.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    const totals = { expected: 0, received: 0, pending: 0 };
    for (const row of rows) {
      const amount = row._sum.amount != null ? Number(row._sum.amount) : 0;
      if (row.type === 'expected') totals.expected += amount;
      if (row.type === 'received') totals.received += amount;
      if (row.type === 'pending') totals.pending += amount;
    }
    return totals;
  }

  async countInvoicesByStatus(): Promise<Record<string, number>> {
    const invoice = this.client('invoice') as {
      groupBy: (args: unknown) => Promise<Array<{ status: string; _count: { _all: number } }>>;
    } | null;
    if (!invoice) {
      return { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
    }

    const rows = await invoice.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const counts = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
    for (const row of rows) {
      const key = row.status as keyof typeof counts;
      if (key in counts) counts[key] = row._count._all;
    }
    return counts;
  }

  async sumEscrowHolding(): Promise<number> {
    const escrow = this.client('escrow') as {
      aggregate: (args: unknown) => Promise<{ _sum: { amount: unknown } }>;
    } | null;
    if (!escrow) return 0;
    const result = await escrow.aggregate({
      where: { status: 'holding' },
      _sum: { amount: true },
    });
    return result._sum.amount != null ? Number(result._sum.amount) : 0;
  }

  async sumScheduledPayouts(): Promise<number> {
    const payout = this.client('payout') as {
      aggregate: (args: unknown) => Promise<{ _sum: { amount: unknown } }>;
    } | null;
    if (!payout) return 0;
    const result = await payout.aggregate({
      where: { status: { in: ['scheduled', 'processing'] } },
      _sum: { amount: true },
    });
    return result._sum.amount != null ? Number(result._sum.amount) : 0;
  }

  listPaidPayoutsInPeriod(periodStart: Date, periodEnd: Date): Promise<PayoutRow[]> {
    const payout = this.client('payout') as {
      findMany: (args: unknown) => Promise<PayoutRow[]>;
    } | null;
    if (!payout) return Promise.resolve([]);
    return payout.findMany({
      where: {
        status: 'paid',
        paidAt: { gte: periodStart, lte: periodEnd },
      },
      orderBy: [{ paidAt: 'asc' }],
    });
  }
}
