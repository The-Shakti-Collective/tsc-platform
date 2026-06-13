import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { AuthenticatedRequest } from './auth.types';
import { isAuthStubEnabled, requireClerkSecretKey } from './clerk-config';
import { MembershipContextService } from './membership-context.service';
import { StubAuthGuard } from './stub-auth.guard';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly membershipContext: MembershipContextService,
    private readonly stubAuthGuard: StubAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isAuthStubEnabled()) {
      return this.stubAuthGuard.canActivate(context);
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: requireClerkSecretKey(),
      });

      const clerkUserId = payload.sub;
      if (!clerkUserId) {
        throw new UnauthorizedException('Invalid token subject');
      }

      request.clerkUserId = clerkUserId;
      request.membership = await this.membershipContext.resolve(clerkUserId);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
