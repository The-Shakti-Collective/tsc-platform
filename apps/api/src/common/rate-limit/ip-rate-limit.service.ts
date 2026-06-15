import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

interface RateWindow {
  count: number;
  windowStartMs: number;
}

@Injectable()
export class IpRateLimitService {
  private readonly logger = new Logger(IpRateLimitService.name);
  private readonly windows = new Map<string, RateWindow>();
  private readonly windowMs = 60_000;

  assertWithinLimit(key: string, limit: number): void {
    const now = Date.now();
    const existing = this.windows.get(key);

    if (!existing || now - existing.windowStartMs >= this.windowMs) {
      this.windows.set(key, { count: 1, windowStartMs: now });
      return;
    }

    if (existing.count >= limit) {
      this.logger.warn(`IP rate limit exceeded for ${key} (${limit}/min)`);
      throw new HttpException(
        `Rate limit exceeded (${limit} requests/min)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
  }
}
