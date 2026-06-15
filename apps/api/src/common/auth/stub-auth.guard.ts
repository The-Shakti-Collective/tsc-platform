/**
 * Local dev auth bypass — never active when NODE_ENV=production.
 * Enabled via TSC_AUTH_STUB or placeholder CLERK_SECRET_KEY (see clerk-config.ts).
 */
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
    const clerkUserId = this.resolveStubUserIdFromRequest(request);

    if (!clerkUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    request.clerkUserId = clerkUserId;
    try {
      request.membership = await this.membershipContext.resolve(clerkUserId);
    } catch {
      throw new UnauthorizedException('Invalid or unprovisioned stub user');
    }
    return true;
  }

  /** Requires explicit stub credentials — no silent env fallback on the request. */
  private resolveStubUserIdFromRequest(request: AuthenticatedRequest): string | null {
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

    return null;
  }
}

export function assertStubAuthConfigured(): void {
  if (!resolveStubUserId()) {
    throw new UnauthorizedException('Stub auth user id is not configured');
  }
}
