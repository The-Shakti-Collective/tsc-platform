import type { z } from 'zod';
import type {
  DealCreateSchema,
  DealListQuerySchema,
  DealRevenueCreateSchema,
  DealStatusUpdateSchema,
  DealUpdateSchema,
} from '@tsc/contracts/deal/schemas';

export type DealListQuery = z.infer<typeof DealListQuerySchema>;
export type DealCreateInput = z.infer<typeof DealCreateSchema>;
export type DealUpdateInput = z.infer<typeof DealUpdateSchema>;
export type DealStatusUpdateInput = z.infer<typeof DealStatusUpdateSchema>;
export type DealRevenueCreateInput = z.infer<typeof DealRevenueCreateSchema>;
