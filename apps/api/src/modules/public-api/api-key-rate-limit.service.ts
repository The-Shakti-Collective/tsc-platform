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
export class ApiKeyRateLimitService {
  private readonly logger = new Logger(ApiKeyRateLimitService.name);
  private readonly windows = new Map<string, RateWindow>();
  private readonly windowMs = 60_000;

  assertWithinLimit(keyId: string, limit: number): void {
    const now = Date.now();
    const existing = this.windows.get(keyId);

    if (!existing || now - existing.windowStartMs >= this.windowMs) {
      this.windows.set(keyId, { count: 1, windowStartMs: now });
      return;
    }

    if (existing.count >= limit) {
      this.logger.warn(`Rate limit exceeded for API key ${keyId} (${limit}/min stub)`);
      throw new HttpException(
        `Rate limit exceeded (${limit} requests/min)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
  }
}
