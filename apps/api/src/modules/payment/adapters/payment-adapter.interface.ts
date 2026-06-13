import type { PaymentProviderValue } from '@tsc/database';

export interface PaymentIntentInput {
  amount: number;
  currency: string;
  referenceId: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentResult {
  externalId: string;
  checkoutUrl: string;
  status: 'created' | 'pending';
}

export interface EscrowHoldInput {
  amount: number;
  currency: string;
  referenceId: string;
  metadata?: Record<string, unknown>;
}

export interface EscrowHoldResult {
  externalId: string;
  status: 'holding';
}

export interface EscrowReleaseInput {
  externalId: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface EscrowReleaseResult {
  externalId: string;
  status: 'released';
}

export interface PayoutScheduleInput {
  amount: number;
  currency: string;
  beneficiaryId: string;
  referenceId: string;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PayoutScheduleResult {
  externalId: string;
  status: 'scheduled' | 'processing';
}

export interface PaymentAdapter {
  readonly provider: PaymentProviderValue;
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  holdEscrow(input: EscrowHoldInput): Promise<EscrowHoldResult>;
  releaseEscrow(input: EscrowReleaseInput): Promise<EscrowReleaseResult>;
  schedulePayout(input: PayoutScheduleInput): Promise<PayoutScheduleResult>;
}
