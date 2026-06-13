import type { Prisma } from '@prisma/client';

export const DEAL_STATUSES = [
  'application',
  'discussion',
  'negotiation',
  'agreement',
  'completed',
  'paid',
] as const;

export type DealStatusValue = (typeof DEAL_STATUSES)[number];

export const REVENUE_TRANSACTION_TYPES = ['expected', 'received', 'pending'] as const;

export type RevenueTransactionTypeValue = (typeof REVENUE_TRANSACTION_TYPES)[number];

/** Ordered pipeline — advance moves to next index. */
export const DEAL_STATUS_PIPELINE: DealStatusValue[] = [
  'application',
  'discussion',
  'negotiation',
  'agreement',
  'completed',
  'paid',
];

export function nextDealStatus(current: DealStatusValue): DealStatusValue | null {
  const index = DEAL_STATUS_PIPELINE.indexOf(current);
  if (index < 0 || index >= DEAL_STATUS_PIPELINE.length - 1) return null;
  return DEAL_STATUS_PIPELINE[index + 1] ?? null;
}

export const dealInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      category: true,
      listingType: true,
      city: true,
      value: true,
      brandId: true,
      agencyId: true,
    },
  },
  application: {
    select: {
      id: true,
      status: true,
      appliedAt: true,
    },
  },
  artist: {
    select: { id: true, name: true, slug: true },
  },
  brand: {
    select: { id: true, name: true, logo: true },
  },
  agency: {
    select: { id: true, name: true },
  },
  _count: {
    select: { revenue: true },
  },
} satisfies Prisma.DealInclude;

export function dealListWhere(input: {
  artistId?: string;
  brandId?: string;
  agencyId?: string;
  status?: DealStatusValue;
}): Prisma.DealWhereInput {
  const where: Prisma.DealWhereInput = {};
  if (input.artistId) where.artistId = input.artistId;
  if (input.brandId) where.brandId = input.brandId;
  if (input.agencyId) where.agencyId = input.agencyId;
  if (input.status) where.status = input.status;
  return where;
}
