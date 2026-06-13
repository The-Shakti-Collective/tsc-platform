export const PAYMENT_PROVIDERS = ['razorpay', 'stripe', 'cashfree', 'manual'] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const ESCROW_STATUSES = ['pending', 'holding', 'released', 'cancelled'] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

export const PAYOUT_STATUSES = ['scheduled', 'processing', 'paid', 'failed', 'cancelled'] as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const SETTLEMENT_STATUSES = ['draft', 'pending', 'settled', 'cancelled'] as const;

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceSummary {
  id: string;
  contractId: string | null;
  dealId: string | null;
  bookingRequestId: string | null;
  artistId: string;
  brandId: string | null;
  amount: number | null;
  currency: string;
  status: InvoiceStatus;
  dueDate: string | null;
  paidAt: string | null;
  paymentProvider: PaymentProvider | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCollectPayload {
  invoiceId: string;
  provider: PaymentProvider;
  externalId: string;
  checkoutUrl: string;
  status: InvoiceStatus;
  updatedAt: string;
}

export interface InvoiceMarkPaidPayload {
  id: string;
  status: InvoiceStatus;
  paidAt: string;
  paymentProvider: PaymentProvider;
  dealId: string | null;
  dealStatus: string | null;
  revenueRecorded: boolean;
  updatedAt: string;
}

export interface EscrowSummary {
  id: string;
  dealId: string | null;
  contractId: string | null;
  amount: number;
  currency: string;
  status: EscrowStatus;
  provider: PaymentProvider;
  externalId: string | null;
  heldAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

export interface EscrowHoldPayload {
  id: string;
  dealId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  provider: PaymentProvider;
  externalId: string;
  heldAt: string;
}

export interface EscrowReleasePayload {
  id: string;
  status: EscrowStatus;
  externalId: string | null;
  releasedAt: string;
  updatedAt: string;
}

export interface PayoutSummary {
  id: string;
  artistId: string | null;
  personId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider: PaymentProvider;
  externalId: string | null;
  scheduledAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PayoutSchedulePayload {
  id: string;
  artistId: string | null;
  personId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider: PaymentProvider;
  externalId: string;
  scheduledAt: string;
  createdAt: string;
}

export interface PayoutListPayload {
  items: PayoutSummary[];
  artistId: string | null;
  updatedAt: string;
}

export interface SettlementSummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  currency: string;
  status: SettlementStatus;
  payoutIds: string[];
  settledAt: string | null;
  createdAt: string;
}

export interface SettlementListPayload {
  items: SettlementSummary[];
  updatedAt: string;
}

export interface PaymentsDashboardPayload {
  expected: number;
  received: number;
  pending: number;
  currency: string;
  invoiceCounts: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
  escrowHolding: number;
  payoutsScheduled: number;
  updatedAt: string;
}
