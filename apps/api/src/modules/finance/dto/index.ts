import { z } from 'zod';

const orgId = z.string().min(1);

export const ExpenseCreateSchema = z.object({
  organizationId: orgId,
  title: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  category: z.string().optional(),
  incurredAt: z.string().datetime().optional(),
  status: z.enum(['draft', 'approved', 'paid', 'void']).optional(),
});

export const FinanceListQuerySchema = z.object({
  organizationId: orgId,
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ExpenseCreateInput = z.infer<typeof ExpenseCreateSchema>;
