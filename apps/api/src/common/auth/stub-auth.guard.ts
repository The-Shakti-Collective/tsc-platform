import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.types';
import { resolveStubUserId } from './clerk-config';
import { MembershipContextService } from './membership-context.service';

const STUB_BEARER_PREFIX = 'stub:';

@Injectable()
export class StubAuthGuard implements CanActivate {
  constructor(private readonly membershipContext: MembershipContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const clerkUserId = this.resolveStubUserId(request);

    request.clerkUserId = clerkUserId;
    request.membership = await this.membershipContext.resolve(clerkUserId);
    return true;
  }

  private resolveStubUserId(request: AuthenticatedRequest): string {
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token.startsWith(STUB_BEARER_PREFIX)) {
        const userId = token.slice(STUB_BEARER_PREFIX.length).trim();
        if (userId) return userId;
      }
      if (token && !token.includes('.')) {
        return token;
      }
    }

    const headerUserId = request.headers?.['x-stub-user-id'];
    const fromHeader = Array.isArray(headerUserId) ? headerUserId[0] : headerUserId;
    if (fromHeader?.trim()) return fromHeader.trim();

    return resolveStubUserId();
  }
}

export function assertStubAuthConfigured(): void {
  if (!resolveStubUserId()) {
    throw new UnauthorizedException('Stub auth user id is not configured');
  }
}
