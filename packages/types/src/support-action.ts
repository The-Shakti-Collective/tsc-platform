import type {
  SupportActionStatusValue,
  SupportActionTypeValue,
  SupportTargetTypeValue,
} from '@tsc/database';

export interface SupportActionRecord {
  id: string;
  supporterPersonId: string;
  targetType: SupportTargetTypeValue;
  targetId: string;
  actionType: SupportActionTypeValue;
  amount: number | null;
  currency: string | null;
  status: SupportActionStatusValue;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RecordSupportPayload {
  supportActionId: string;
  supporterPersonId: string;
  targetType: SupportTargetTypeValue;
  targetId: string;
  actionType: SupportActionTypeValue;
  amount: number | null;
  currency: string | null;
  status: SupportActionStatusValue;
  relationshipId: string;
  relationshipType: 'SUPPORTED' | 'PURCHASED';
  creditsEarned: number | null;
  spendScoreDelta: number;
  created: boolean;
  updatedAt: string;
}

export interface SupportHistoryPayload {
  personId: string;
  items: SupportActionRecord[];
  total: number;
  updatedAt: string;
}

export interface SupporterSummary {
  personId: string;
  displayName: string;
  slug: string | null;
  supportCount: number;
  totalAmount: number;
  lastSupportedAt: string;
}

export interface TargetSupportersPayload {
  targetType: SupportTargetTypeValue;
  targetId: string;
  supporters: SupporterSummary[];
  total: number;
  updatedAt: string;
}
