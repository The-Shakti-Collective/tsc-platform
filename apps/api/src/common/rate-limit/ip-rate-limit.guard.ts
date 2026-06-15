import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { IpRateLimitService } from './ip-rate-limit.service';

const DEFAULT_PUBLIC_LIMIT = Number(process.env.TSC_PUBLIC_RATE_LIMIT_PER_MIN ?? 60);

@Injectable()
export class IpRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimit: IpRateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      request.ip ??
      'unknown';
    this.rateLimit.assertWithinLimit(`ip:${ip}`, DEFAULT_PUBLIC_LIMIT);
    return true;
  }
}
