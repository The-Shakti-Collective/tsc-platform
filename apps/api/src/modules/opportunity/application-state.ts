import type { OpportunityApplicationStatus } from '@tsc/types';

/** Valid application status transitions for marketplace flow. */
const TRANSITIONS: Record<
  OpportunityApplicationStatus,
  OpportunityApplicationStatus[]
> = {
  saved: ['applied'],
  applied: ['shortlisted', 'rejected', 'won'],
  shortlisted: ['won', 'rejected'],
  won: [],
  rejected: [],
};

export class InvalidApplicationTransitionError extends Error {
  constructor(
    public readonly from: OpportunityApplicationStatus,
    public readonly to: OpportunityApplicationStatus,
  ) {
    super(`Cannot transition application from "${from}" to "${to}"`);
    this.name = 'InvalidApplicationTransitionError';
  }
}

export function assertApplicationTransition(
  from: OpportunityApplicationStatus,
  to: OpportunityApplicationStatus,
): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new InvalidApplicationTransitionError(from, to);
  }
}

export function isTerminalApplicationStatus(
  status: OpportunityApplicationStatus,
): boolean {
  return status === 'won' || status === 'rejected';
}

export function applicationActionForStatus(
  status: OpportunityApplicationStatus,
): 'save' | 'apply' | 'admin' {
  if (status === 'saved') return 'save';
  if (status === 'applied') return 'apply';
  return 'admin';
}
