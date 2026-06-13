import type { z } from 'zod';
import type {
  EscrowHoldSchema,
  EscrowReleaseSchema,
  InvoiceCollectSchema,
  InvoiceMarkPaidSchema,
  PayoutScheduleSchema,
  PaymentsDashboardQuerySchema,
  SettlementListQuerySchema,
} from '@tsc/contracts';

export type InvoiceCollectInput = z.infer<typeof InvoiceCollectSchema>;
export type InvoiceMarkPaidInput = z.infer<typeof InvoiceMarkPaidSchema>;
export type EscrowHoldInput = z.infer<typeof EscrowHoldSchema>;
export type EscrowReleaseInput = z.infer<typeof EscrowReleaseSchema>;
export type PayoutScheduleInput = z.infer<typeof PayoutScheduleSchema>;
export type SettlementListQuery = z.infer<typeof SettlementListQuerySchema>;
export type PaymentsDashboardQuery = z.infer<typeof PaymentsDashboardQuerySchema>;
