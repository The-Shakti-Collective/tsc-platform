import { Injectable, Logger, Optional } from '@nestjs/common';
import type { SyncEventEnvelope } from '@tsc/contracts/sync';
import { SyncEmitter } from '../sync/sync.emitter';
import { WebhookEmitterService } from '../data-exchange/webhook-emitter.service';

export interface DealSyncEventPayload {
  type: 'deal.status_changed';
  externalId: string;
  entityType: 'Deal';
  data: {
    dealId: string;
    opportunityId?: string;
    applicationId?: string;
    artistId?: string;
    brandId?: string;
    agencyId?: string;
    previousStatus?: string;
    status: string;
    value?: number;
    currency?: string;
    paidAt?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Deal pipeline → CoreKnot CRM sync stub (Month 3).
 * Phase 10.5: partner webhook on deal.completed when status is paid.
 */
@Injectable()
export class DealSyncEmitter {
  private readonly logger = new Logger(DealSyncEmitter.name);

  constructor(
    private readonly syncEmitter: SyncEmitter,
    @Optional() private readonly webhookEmitter?: WebhookEmitterService,
  ) {}

  emit(input: DealSyncEventPayload): void {
    const event: SyncEventEnvelope = {
      eventType: 'deal.status_changed',
      sourceSystem: 'tsc',
      externalId: input.externalId,
      entityType: 'Deal',
      entityExternalId: input.externalId,
      occurredAt: new Date().toISOString(),
      data: {
        dealId: input.data.dealId,
        opportunityId: input.data.opportunityId,
        applicationId: input.data.applicationId,
        artistId: input.data.artistId,
        brandId: input.data.brandId,
        agencyId: input.data.agencyId,
        previousStatus: input.data.previousStatus,
        status: input.data.status,
        value: input.data.value,
        currency: input.data.currency,
        paidAt: input.data.paidAt,
        metadata: input.data.metadata,
      },
    };

    void this.syncEmitter.emit(event).catch((err) => {
      this.logger.warn(`deal sync emit failed: ${err}`);
    });

    const status = input.data.status;
    if (status === 'paid' || status === 'completed') {
      this.webhookEmitter?.emit('deal.completed', {
        dealId: input.externalId,
        ...input.data,
      });
    }
  }
}
