import type { CreditEarnReason } from '@tsc/database';

export interface EcosystemCreditBalance {
  personId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export interface EcosystemCreditTransactionRecord {
  id: string;
  personId: string;
  amount: number;
  reason: CreditEarnReason | string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface EcosystemCreditHistoryPayload {
  personId: string;
  items: EcosystemCreditTransactionRecord[];
  total: number;
  updatedAt: string;
}

export interface EcosystemCreditEarnPayload {
  personId: string;
  amount: number;
  reason: CreditEarnReason;
  referenceType?: string | null;
  referenceId?: string | null;
  balance: number;
  lifetimeEarned: number;
  createdAt: string;
}
