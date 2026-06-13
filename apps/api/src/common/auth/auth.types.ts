import type { IncomingHttpHeaders } from 'node:http';
import type { MembershipContext } from '@tsc/permissions';

export type AuthenticatedRequest = {
  headers?: IncomingHttpHeaders;
  membership?: MembershipContext;
  clerkUserId?: string;
};
