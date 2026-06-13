export {
  DealCreateSchema,
  DealListQuerySchema,
  DealRevenueCreateSchema,
  DealStatusSchema,
  DealStatusUpdateSchema,
  DealUpdateSchema,
  RevenueTransactionTypeSchema,
} from '@tsc/contracts/deal/schemas';

import { z } from 'zod';
import { DealListQuerySchema } from '@tsc/contracts/deal/schemas';

export type DealListQuery = z.infer<typeof DealListQuerySchema>;
