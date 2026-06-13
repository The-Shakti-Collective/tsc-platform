export type CollaborationApplicationStatus =
  | 'applied'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

const VALID_TRANSITIONS: Record<
  CollaborationApplicationStatus,
  CollaborationApplicationStatus[]
> = {
  applied: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export class InvalidCollaborationApplicationTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition collaboration application from ${from} to ${to}`);
    this.name = 'InvalidCollaborationApplicationTransitionError';
  }
}

export function assertCollaborationApplicationTransition(
  from: string,
  to: CollaborationApplicationStatus,
): void {
  const allowed = VALID_TRANSITIONS[from as CollaborationApplicationStatus];
  if (!allowed?.includes(to)) {
    throw new InvalidCollaborationApplicationTransitionError(from, to);
  }
}
