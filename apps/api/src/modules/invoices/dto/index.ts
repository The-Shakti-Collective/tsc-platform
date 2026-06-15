import { z } from 'zod';

export const InvoiceCreateSchema = z.object({
  artistId: z.string().min(1),
  dealId: z.string().optional(),
  contractId: z.string().optional(),
  bookingRequestId: z.string().optional(),
  brandId: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const InvoiceListQuerySchema = z.object({
  artistId: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;
