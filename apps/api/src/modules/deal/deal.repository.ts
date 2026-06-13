import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  dealInclude,
  dealListWhere,
  type DealStatusValue,
  type RevenueTransactionTypeValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';

type DealRow = {
  id: string;
  opportunityId: string;
  applicationId: string | null;
  artistId: string;
  brandId: string | null;
  agencyId: string | null;
  status: string;
  value: unknown;
  currency: string;
  startDate: Date | null;
  endDate: Date | null;
  negotiationNotes: string | null;
  agreementUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  opportunity?: {
    id: string;
    title: string;
    category?: string | null;
    listingType?: string | null;
    city?: string | null;
    value: unknown;
    brandId?: string | null;
    agencyId?: string | null;
  };
  application?: {
    id: string;
    status: string;
    appliedAt: Date | null;
  } | null;
  artist?: { id: string; name: string; slug: string | null };
  brand?: { id: string; name: string; logo: string | null } | null;
  agency?: { id: string; name: string } | null;
  _count?: { revenue: number };
};

type RevenueRow = {
  id: string;
  dealId: string;
  amount: unknown;
  type: string;
  recordedAt: Date;
  notes: string | null;
};

type DealClient = {
  findMany: (args: unknown) => Promise<DealRow[]>;
  findUnique: (args: unknown) => Promise<DealRow | null>;
  findFirst: (args: unknown) => Promise<DealRow | null>;
  create: (args: unknown) => Promise<DealRow>;
  update: (args: unknown) => Promise<DealRow>;
};

type RevenueClient = {
  create: (args: unknown) => Promise<RevenueRow>;
  findMany: (args: unknown) => Promise<RevenueRow[]>;
};

@Injectable()
export class DealRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get dealClient(): DealClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & { deal?: DealClient };
    return client.deal ?? null;
  }

  private get revenueClient(): RevenueClient | null {
    const client = this.prisma.client as Prisma.TransactionClient & {
      revenueTransaction?: RevenueClient;
    };
    return client.revenueTransaction ?? null;
  }

  isAvailable(): boolean {
    return this.dealClient != null;
  }

  list(query: {
    artistId?: string;
    brandId?: string;
    agencyId?: string;
    status?: DealStatusValue;
    limit?: number;
  }) {
    if (!this.dealClient) return Promise.resolve([]);
    return this.dealClient.findMany({
      where: dealListWhere(query),
      include: dealInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: query.limit ?? 50,
    });
  }

  findById(id: string) {
    if (!this.dealClient) return Promise.resolve(null);
    return this.dealClient.findUnique({ where: { id }, include: dealInclude });
  }

  findByApplicationId(applicationId: string) {
    if (!this.dealClient) return Promise.resolve(null);
    return this.dealClient.findFirst({
      where: { applicationId },
      include: dealInclude,
    });
  }

  create(input: {
    opportunityId: string;
    applicationId?: string | null;
    artistId: string;
    brandId?: string | null;
    agencyId?: string | null;
    status?: DealStatusValue;
    value?: number | null;
    currency?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    negotiationNotes?: string | null;
  }) {
    if (!this.dealClient) return Promise.resolve(null);
    return this.dealClient.create({
      data: {
        id: newId(),
        opportunityId: input.opportunityId,
        applicationId: input.applicationId ?? null,
        artistId: input.artistId,
        brandId: input.brandId ?? null,
        agencyId: input.agencyId ?? null,
        status: input.status ?? 'discussion',
        value: input.value ?? null,
        currency: input.currency ?? 'INR',
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        negotiationNotes: input.negotiationNotes ?? null,
      },
      include: dealInclude,
    });
  }

  update(
    id: string,
    data: {
      status?: DealStatusValue;
      value?: number | null;
      currency?: string;
      startDate?: Date | null;
      endDate?: Date | null;
      negotiationNotes?: string | null;
      agreementUrl?: string | null;
      paidAt?: Date | null;
    },
  ) {
    if (!this.dealClient) return Promise.resolve(null);
    return this.dealClient.update({
      where: { id },
      data: {
        status: data.status,
        value: data.value,
        currency: data.currency,
        startDate: data.startDate,
        endDate: data.endDate,
        negotiationNotes: data.negotiationNotes,
        agreementUrl: data.agreementUrl === '' ? null : data.agreementUrl,
        paidAt: data.paidAt,
      },
      include: dealInclude,
    });
  }

  createRevenue(input: {
    dealId: string;
    amount: number;
    type: RevenueTransactionTypeValue;
    notes?: string | null;
    recordedAt?: Date;
  }) {
    if (!this.revenueClient) return Promise.resolve(null);
    return this.revenueClient.create({
      data: {
        id: newId(),
        dealId: input.dealId,
        amount: input.amount,
        type: input.type,
        notes: input.notes ?? null,
        recordedAt: input.recordedAt ?? new Date(),
      },
    });
  }

  listRevenue(dealId: string) {
    if (!this.revenueClient) return Promise.resolve([]);
    return this.revenueClient.findMany({
      where: { dealId },
      orderBy: [{ recordedAt: 'desc' }],
    });
  }
}
