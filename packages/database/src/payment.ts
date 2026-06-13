import type { Prisma } from '@prisma/client';
import type { InvoiceStatusValue } from './contract.js';
export { INVOICE_STATUSES, type InvoiceStatusValue } from './contract.js';

export const PAYMENT_PROVIDERS = ['razorpay', 'stripe', 'cashfree', 'manual'] as const;

export type PaymentProviderValue = (typeof PAYMENT_PROVIDERS)[number];

export const ESCROW_STATUSES = ['pending', 'holding', 'released', 'cancelled'] as const;

export type EscrowStatusValue = (typeof ESCROW_STATUSES)[number];

export const PAYOUT_STATUSES = ['scheduled', 'processing', 'paid', 'failed', 'cancelled'] as const;

export type PayoutStatusValue = (typeof PAYOUT_STATUSES)[number];

export const SETTLEMENT_STATUSES = ['draft', 'pending', 'settled', 'cancelled'] as const;

export type SettlementStatusValue = (typeof SETTLEMENT_STATUSES)[number];

export const invoiceInclude = {
  contract: {
    select: { id: true, status: true, dealId: true },
  },
  deal: {
    select: { id: true, status: true, value: true, currency: true, artistId: true },
  },
  bookingRequest: {
    select: { id: true, status: true },
  },
} satisfies Prisma.InvoiceInclude;

export function invoiceListWhere(input: {
  dealId?: string;
  contractId?: string;
  artistId?: string;
  status?: InvoiceStatusValue;
}): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = {};
  if (input.dealId) where.dealId = input.dealId;
  if (input.contractId) where.contractId = input.contractId;
  if (input.artistId) where.artistId = input.artistId;
  if (input.status) where.status = input.status;
  return where;
}

export function payoutListWhere(input: {
  artistId?: string;
  personId?: string;
  status?: PayoutStatusValue;
}): Prisma.PayoutWhereInput {
  const where: Prisma.PayoutWhereInput = {};
  if (input.artistId) where.artistId = input.artistId;
  if (input.personId) where.personId = input.personId;
  if (input.status) where.status = input.status;
  return where;
}
