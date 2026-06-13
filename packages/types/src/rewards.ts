import type {
  RewardCategoryValue,
  RewardRedemptionStatusValue,
} from '@tsc/database';

export interface RewardRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  creditCost: number;
  category: RewardCategoryValue;
  stock: number | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RewardCatalogPayload {
  items: RewardRecord[];
  total: number;
  updatedAt: string;
}

export interface RewardRedemptionRecord {
  id: string;
  rewardId: string;
  personId: string;
  creditCost: number;
  status: RewardRedemptionStatusValue;
  redeemedAt: string;
  fulfilledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemptionWithReward extends RewardRedemptionRecord {
  reward: RewardRecord;
}

export interface RewardRedeemPayload {
  rewardId: string;
  personId: string;
  redemptionId: string;
  creditCost: number;
  status: RewardRedemptionStatusValue;
  balanceAfter: number;
  created: boolean;
  updatedAt: string;
}

export interface MyRewardRedemptionsPayload {
  personId: string;
  items: RewardRedemptionWithReward[];
  total: number;
  updatedAt: string;
}

export interface RewardRedemptionPatchPayload {
  id: string;
  status: RewardRedemptionStatusValue;
  fulfilledAt: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface CreditShareStubPayload {
  personId: string;
  amount: number;
  balance: number;
  created: boolean;
  updatedAt: string;
}

export interface CreditReferStubPayload {
  personId: string;
  referredPersonId: string;
  relationshipId: string;
  amount: number;
  balance: number;
  created: boolean;
  updatedAt: string;
}
