/** Phase 8 Step 3 — Community membership program helpers. */

export const MEMBERSHIP_BENEFITS = [
  'early_access',
  'private_events',
  'meetups',
  'discounts',
  'exclusive_content',
] as const;

export type MembershipBenefitValue = (typeof MEMBERSHIP_BENEFITS)[number];

export const MEMBERSHIP_PROGRAM_TIERS = [
  'standard',
  'plus',
  'premium',
  'circle',
  'collective',
] as const;

export type MembershipProgramTierValue = (typeof MEMBERSHIP_PROGRAM_TIERS)[number];

export const MEMBERSHIP_SUBSCRIPTION_STATUSES = [
  'active',
  'cancelled',
  'expired',
  'pending',
] as const;

export type MembershipSubscriptionStatusValue =
  (typeof MEMBERSHIP_SUBSCRIPTION_STATUSES)[number];

export const MEMBERSHIP_PROGRAM_MODELS = ['Membership', 'MembershipSubscription'] as const;

export type MembershipProgramModel = (typeof MEMBERSHIP_PROGRAM_MODELS)[number];

export function normalizeMembershipBenefits(
  benefits?: string[] | null,
): MembershipBenefitValue[] {
  if (!benefits?.length) return [];
  return benefits.filter((b): b is MembershipBenefitValue =>
    (MEMBERSHIP_BENEFITS as readonly string[]).includes(b),
  );
}

export function normalizeMembershipTier(
  tier?: string | null,
): MembershipProgramTierValue {
  if (tier && (MEMBERSHIP_PROGRAM_TIERS as readonly string[]).includes(tier)) {
    return tier as MembershipProgramTierValue;
  }
  return 'standard';
}
