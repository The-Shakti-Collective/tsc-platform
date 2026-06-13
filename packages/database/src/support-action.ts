/** Phase 8 Step 6 — Creator-Fan Economy support actions (track-only). */

export const SUPPORT_TARGET_TYPES = ['Artist', 'Community', 'Event'] as const;

export type SupportTargetTypeValue = (typeof SUPPORT_TARGET_TYPES)[number];

export const SUPPORT_ACTION_TYPES = [
  'buy_ticket',
  'buy_membership',
  'buy_workshop',
  'buy_experience',
  'general_support',
] as const;

export type SupportActionTypeValue = (typeof SUPPORT_ACTION_TYPES)[number];

export const SUPPORT_ACTION_STATUSES = ['recorded', 'pending_payment'] as const;

export type SupportActionStatusValue = (typeof SUPPORT_ACTION_STATUSES)[number];

export const SUPPORT_ACTION_MODELS = ['SupportAction'] as const;

export type SupportActionModel = (typeof SUPPORT_ACTION_MODELS)[number];

/** Commerce action types create PURCHASED edges; general_support creates SUPPORTED. */
export const PURCHASE_SUPPORT_ACTION_TYPES: SupportActionTypeValue[] = [
  'buy_ticket',
  'buy_membership',
  'buy_workshop',
  'buy_experience',
];

export function isPurchaseSupportAction(
  actionType: SupportActionTypeValue,
): boolean {
  return PURCHASE_SUPPORT_ACTION_TYPES.includes(actionType);
}

/** Default spendScore bump when amount is omitted (track-only stub). */
export const SUPPORT_SPEND_SCORE_STUB: Partial<
  Record<SupportActionTypeValue, number>
> = {
  general_support: 5,
  buy_ticket: 10,
  buy_membership: 15,
  buy_workshop: 20,
  buy_experience: 25,
};

export function spendScoreDeltaForSupport(
  actionType: SupportActionTypeValue,
  amount?: number | null,
): number {
  if (amount != null && amount > 0) return amount;
  return SUPPORT_SPEND_SCORE_STUB[actionType] ?? 5;
}
