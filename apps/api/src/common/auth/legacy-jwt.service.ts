import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import {
  isLegacyJwtBridgeEnabled,
  legacyJwtAbsoluteMaxMs,
  requireLegacyJwtSecret,
} from './legacy-jwt-config';

export type LegacySessionClaims = {
  id: string;
  loginAt?: number;
  jti?: string;
  purpose?: string;
  iat?: number;
};

@Injectable()
export class LegacyJwtService {
  isEnabled(): boolean {
    return isLegacyJwtBridgeEnabled();
  }

  verifySessionToken(token: string): LegacySessionClaims {
    if (!this.isEnabled()) {
      throw new UnauthorizedException('Legacy JWT bridge is disabled');
    }

    const secret = requireLegacyJwtSecret();
    if (!secret) {
      throw new UnauthorizedException('Legacy JWT secret is not configured');
    }

    let decoded: LegacySessionClaims;
    try {
      decoded = jwt.verify(token, secret) as LegacySessionClaims;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (decoded.purpose) {
      throw new UnauthorizedException('Not authorized, token failed');
    }

    if (!decoded.id || typeof decoded.id !== 'string') {
      throw new UnauthorizedException('Invalid legacy token subject');
    }

    if (this.isAbsoluteSessionExpired(decoded)) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    return decoded;
  }

  private isAbsoluteSessionExpired(decoded: LegacySessionClaims): boolean {
    const loginAt = this.resolveLoginAt(decoded);
    return Date.now() - loginAt * 1000 > legacyJwtAbsoluteMaxMs();
  }

  private resolveLoginAt(decoded: LegacySessionClaims): number {
    if (decoded.loginAt != null && Number.isFinite(decoded.loginAt)) {
      return decoded.loginAt;
    }
    if (decoded.iat != null && Number.isFinite(decoded.iat)) {
      return decoded.iat;
    }
    return Math.floor(Date.now() / 1000);
  }
}
