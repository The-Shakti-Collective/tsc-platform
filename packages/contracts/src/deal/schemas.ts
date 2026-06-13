import { z } from 'zod';

export const DealStatusSchema = z.enum([
  'application',
  'discussion',
  'negotiation',
  'agreement',
  'completed',
  'paid',
]);

export const RevenueTransactionTypeSchema = z.enum(['expected', 'received', 'pending']);

export const DealListQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  agencyId: z.string().min(1).optional(),
  status: DealStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const DealCreateSchema = z.object({
  applicationId: z.string().min(1),
  value: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).optional().default('INR'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  negotiationNotes: z.string().max(4000).optional(),
});

export const DealUpdateSchema = z.object({
  value: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  negotiationNotes: z.string().max(4000).nullable().optional(),
  agreementUrl: z.string().url().nullable().optional().or(z.literal('')),
});

export const DealStatusUpdateSchema = z.object({
  status: DealStatusSchema.optional(),
  advance: z.boolean().optional().default(false),
});

export const DealRevenueCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  type: RevenueTransactionTypeSchema,
  notes: z.string().max(2000).optional(),
  recordedAt: z.string().datetime().optional(),
});
