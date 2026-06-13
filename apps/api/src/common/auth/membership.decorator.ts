import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import type { AuthenticatedRequest } from './auth.types';

export const Membership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MembershipContext => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.membership) {
      throw new UnauthorizedException('Authentication required');
    }
    return request.membership;
  },
);
