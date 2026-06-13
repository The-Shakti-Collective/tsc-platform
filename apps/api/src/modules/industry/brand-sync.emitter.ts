import { Injectable, Logger } from '@nestjs/common';
import type { SyncEventEnvelope } from '@tsc/contracts/sync';
import { SyncEmitter } from '../sync/sync.emitter';

export interface BrandSyncEventPayload {
  type: 'brand.created';
  externalId: string;
  entityType: 'Brand';
  data: {
    brandId?: string;
    name: string;
    industry?: string;
    city?: string;
    country?: string;
    personId?: string;
    personExternalId?: string;
    website?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Brand OS → CoreKnot sync stub (Month 1).
 */
@Injectable()
export class BrandSyncEmitter {
  private readonly logger = new Logger(BrandSyncEmitter.name);

  constructor(private readonly syncEmitter: SyncEmitter) {}

  emit(input: BrandSyncEventPayload): void {
    const event: SyncEventEnvelope = {
      eventType: 'brand.created',
      sourceSystem: 'tsc',
      externalId: input.externalId,
      entityType: 'Brand',
      entityExternalId: input.externalId,
      occurredAt: new Date().toISOString(),
      data: {
        brandId: input.data.brandId ?? input.externalId,
        name: input.data.name,
        industry: input.data.industry,
        city: input.data.city,
        country: input.data.country,
        personId: input.data.personId,
        personExternalId: input.data.personExternalId,
        website: input.data.website,
        metadata: input.data.metadata,
      },
    };

    void this.syncEmitter.emit(event).catch((err) => {
      this.logger.warn(`brand sync emit failed: ${err}`);
    });
  }
}
