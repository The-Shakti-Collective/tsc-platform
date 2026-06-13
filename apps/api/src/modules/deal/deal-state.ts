import type { DealStatusValue } from '@tsc/database';
import { DEAL_STATUS_PIPELINE } from '@tsc/database';

export class InvalidDealTransitionError extends Error {
  constructor(
    public readonly from: DealStatusValue,
    public readonly to: DealStatusValue,
  ) {
    super(`Cannot transition deal from "${from}" to "${to}"`);
    this.name = 'InvalidDealTransitionError';
  }
}

export function assertDealTransition(from: DealStatusValue, to: DealStatusValue): void {
  const fromIndex = DEAL_STATUS_PIPELINE.indexOf(from);
  const toIndex = DEAL_STATUS_PIPELINE.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || toIndex !== fromIndex + 1) {
    throw new InvalidDealTransitionError(from, to);
  }
}

export function advanceDealStatus(current: DealStatusValue): DealStatusValue | null {
  const index = DEAL_STATUS_PIPELINE.indexOf(current);
  if (index < 0 || index >= DEAL_STATUS_PIPELINE.length - 1) return null;
  return DEAL_STATUS_PIPELINE[index + 1] ?? null;
}
