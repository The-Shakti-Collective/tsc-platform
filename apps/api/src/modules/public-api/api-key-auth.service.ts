import {
  createHash,
  randomBytes,
} from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  API_KEY_HEADER,
  DEFAULT_API_RATE_LIMIT,
  type ApiScopeValue,
} from '@tsc/database';
import type { ApiKeySummary } from '@tsc/types';
import { ApiKeyRepository } from './api-key.repository';
import { ApiKeyRateLimitService } from './api-key-rate-limit.service';

export interface ValidatedApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: ApiScopeValue[];
  ownerOrgId: string | null;
  rateLimit: number;
}

@Injectable()
export class ApiKeyAuthService {
  constructor(
    private readonly repository: ApiKeyRepository,
    private readonly rateLimitService: ApiKeyRateLimitService,
  ) {}

  async validateHeader(
    headerValue: string | undefined,
    requiredScope?: ApiScopeValue,
  ): Promise<ValidatedApiKey> {
    if (!headerValue?.trim()) {
      throw new UnauthorizedException(`Missing ${API_KEY_HEADER} header`);
    }

    const rawKey = headerValue.trim();
    const prefix = rawKey.slice(0, 12);
    const row = await this.repository.findByPrefix(prefix);
    if (!row || !row.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    const hash = this.hashKey(rawKey);
    if (hash !== row.keyHash) {
      throw new UnauthorizedException('Invalid API key');
    }

    const scopes = row.scopes as ApiScopeValue[];
    if (requiredScope && !scopes.includes(requiredScope)) {
      throw new UnauthorizedException(`API key missing scope ${requiredScope}`);
    }

    const limit = row.rateLimit ?? DEFAULT_API_RATE_LIMIT;
    this.rateLimitService.assertWithinLimit(row.id, limit);

    void this.repository.touchLastUsed(row.id);

    return {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      scopes,
      ownerOrgId: row.ownerOrgId,
      rateLimit: limit,
    };
  }

  generateKeyMaterial(): { key: string; prefix: string; keyHash: string } {
    const secret = randomBytes(24).toString('base64url');
    const key = `tsc_${secret}`;
    const prefix = key.slice(0, 12);
    return { key, prefix, keyHash: this.hashKey(key) };
  }

  hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  toSummary(row: {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    ownerOrgId: string | null;
    rateLimit: number;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt: Date | null;
  }): ApiKeySummary {
    return {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      scopes: row.scopes as ApiScopeValue[],
      ownerOrgId: row.ownerOrgId,
      rateLimit: row.rateLimit,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    };
  }
}
