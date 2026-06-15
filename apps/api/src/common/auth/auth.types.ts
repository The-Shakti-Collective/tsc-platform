import type { IncomingHttpHeaders } from 'node:http';
import type { MembershipContext } from '@tsc/permissions';

export type AuthSource = 'clerk' | 'legacy-jwt' | 'stub';

export type AuthenticatedRequest = {
  headers?: IncomingHttpHeaders;
  membership?: MembershipContext;
  clerkUserId?: string;
  /** Mongo User._id when authenticated via legacy JWT bridge. */
  legacyMongoUserId?: string;
  authSource?: AuthSource;
};
