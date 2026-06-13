export const CREDIT_EARN_RULES = {
  attend_event: 10,
  join_community: 5,
  complete_collaboration: 25,
  complete_opportunity: 50,
  help_member: 15,
  superfan_platinum: 10,
  subscribed_membership: 20,
  share_content: 3,
  refer_member: 15,
  general_support: 5,
  fan_purchase: 3,
} as const;

export const CREDIT_SPEND_REASONS = ['redeem_reward'] as const;

export type CreditSpendReason = (typeof CREDIT_SPEND_REASONS)[number];

export type CreditEarnReason = keyof typeof CREDIT_EARN_RULES;

export const CREDIT_EARN_REASONS = Object.keys(CREDIT_EARN_RULES) as CreditEarnReason[];

export function creditAmountForReason(reason: CreditEarnReason): number {
  return CREDIT_EARN_RULES[reason];
}
