import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { AuthenticatedRequest } from './auth.types';
import { isAuthStubEnabled, requireClerkSecretKey } from './clerk-config';
import { LegacyJwtService } from './legacy-jwt.service';
import { MembershipContextService } from './membership-context.service';
import { StubAuthGuard } from './stub-auth.guard';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly membershipContext: MembershipContextService,
    private readonly stubAuthGuard: StubAuthGuard,
    private readonly legacyJwt: LegacyJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isAuthStubEnabled()) {
      const ok = await this.stubAuthGuard.canActivate(context);
      if (ok) {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        request.authSource = 'stub';
      }
      return ok;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

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
      request.authSource = 'clerk';
      request.membership = await this.membershipContext.resolve(clerkUserId);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      if (this.legacyJwt.isEnabled()) {
        try {
          return await this.authenticateLegacyJwt(request, token);
        } catch (legacyError) {
          if (legacyError instanceof UnauthorizedException) throw legacyError;
          throw new UnauthorizedException('Invalid or expired token');
        }
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async authenticateLegacyJwt(
    request: AuthenticatedRequest,
    token: string,
  ): Promise<boolean> {
    const decoded = this.legacyJwt.verifySessionToken(token);
    request.legacyMongoUserId = decoded.id;
    request.authSource = 'legacy-jwt';
    request.membership = await this.membershipContext.resolveFromLegacyMongoUserId(
      decoded.id,
    );
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length).trim();
    return token || null;
  }
}
