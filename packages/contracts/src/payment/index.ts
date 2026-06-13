import { z } from 'zod';

export const PaymentProviderSchema = z.enum(['razorpay', 'stripe', 'cashfree', 'manual']);

export const InvoiceCollectSchema = z.object({
  provider: PaymentProviderSchema.optional().default('razorpay'),
  amount: z.coerce.number().positive().optional(),
});

export const InvoiceMarkPaidSchema = z.object({
  provider: PaymentProviderSchema.optional().default('manual'),
  paidAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export const EscrowHoldSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).optional().default('INR'),
  contractId: z.string().min(1).optional(),
  provider: PaymentProviderSchema.optional().default('razorpay'),
});

export const EscrowReleaseSchema = z.object({
  provider: PaymentProviderSchema.optional(),
});

export const PayoutScheduleSchema = z.object({
  personId: z.string().min(1),
  artistId: z.string().min(1).optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).optional().default('INR'),
  provider: PaymentProviderSchema.optional().default('razorpay'),
  scheduledAt: z.string().datetime().optional(),
});

export const SettlementListQuerySchema = z.object({
  status: z.enum(['draft', 'pending', 'settled', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const PaymentsDashboardQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  currency: z.string().min(3).max(3).optional().default('INR'),
});
