import { z } from 'zod';

export const RoyaltyListQuerySchema = z.object({
  organizationId: z.string().min(1),
  artistId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const RoyaltyStatementCreateSchema = z.object({
  organizationId: z.string().min(1),
  artistId: z.string().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  currency: z.string().default('INR'),
  grossAmount: z.coerce.number().nonnegative().default(0),
  netAmount: z.coerce.number().nonnegative().default(0),
  source: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        title: z.string().min(1),
        platform: z.string().optional(),
        streams: z.coerce.number().int().optional(),
        amount: z.coerce.number(),
        currency: z.string().default('INR'),
      }),
    )
    .optional(),
});

export const RoyaltyStatementIdParamSchema = z.object({
  id: z.string().min(1),
});

export type RoyaltyListQuery = z.output<typeof RoyaltyListQuerySchema>;
export type RoyaltyStatementCreateInput = z.output<typeof RoyaltyStatementCreateSchema>;
