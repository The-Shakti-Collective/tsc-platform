import type {
  MembershipBenefitValue,
  MembershipProgramTierValue,
  MembershipSubscriptionStatusValue,
} from '@tsc/database';

export interface MembershipProgramRecord {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  tier: MembershipProgramTierValue;
  benefits: MembershipBenefitValue[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipProgramListPayload {
  communityId: string;
  items: MembershipProgramRecord[];
  total: number;
  updatedAt: string;
}

export interface MembershipSubscriptionRecord {
  id: string;
  membershipId: string;
  personId: string;
  status: MembershipSubscriptionStatusValue;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipSubscriptionWithProgram extends MembershipSubscriptionRecord {
  membership: MembershipProgramRecord;
}

export interface MyMembershipSubscriptionsPayload {
  personId: string;
  items: MembershipSubscriptionWithProgram[];
  total: number;
  updatedAt: string;
}

export interface MembershipSubscribePayload {
  membershipId: string;
  personId: string;
  subscriptionId: string;
  status: MembershipSubscriptionStatusValue;
  relationshipId: string;
  communityRelationshipId: string | null;
  created: boolean;
  creditsEarned: number | null;
  updatedAt: string;
}

export interface MembershipCancelPayload {
  membershipId: string;
  personId: string;
  subscriptionId: string;
  status: MembershipSubscriptionStatusValue;
  cancelledAt: string;
  updatedAt: string;
}
