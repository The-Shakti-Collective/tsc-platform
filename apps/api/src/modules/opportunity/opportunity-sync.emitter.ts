import { Injectable, Logger, Optional } from '@nestjs/common';
import type { SyncEventEnvelope } from '@tsc/contracts/sync';
import { SyncEmitter } from '../sync/sync.emitter';
import { WebhookEmitterService } from '../data-exchange/webhook-emitter.service';

export interface OpportunitySyncEventPayload {
  type: 'opportunity.applied' | 'opportunity.saved';
  externalId: string;
  entityType: 'OpportunityApplication';
  data: Record<string, unknown>;
}

/**
 * Opportunity marketplace → CoreKnot CRM sync.
 * Phase 10.5: partner webhook on opportunity.applied.
 */
@Injectable()
export class OpportunitySyncEmitter {
  private readonly logger = new Logger(OpportunitySyncEmitter.name);

  constructor(
    private readonly syncEmitter: SyncEmitter,
    @Optional() private readonly webhookEmitter?: WebhookEmitterService,
  ) {}

  emit(input: OpportunitySyncEventPayload): void {
    if (input.type === 'opportunity.saved') {
      this.logger.debug(`Skipping CoreKnot sync for saved bookmark ${input.externalId}`);
      return;
    }

    const event: SyncEventEnvelope = {
      eventType: 'opportunity.applied',
      sourceSystem: 'tsc',
      externalId: input.externalId,
      entityType: 'OpportunityApplication',
      entityExternalId: input.externalId,
      occurredAt: new Date().toISOString(),
      data: input.data,
    };

    void this.syncEmitter.emit(event).catch((err) => {
      this.logger.warn(`opportunity sync emit failed: ${err}`);
    });

    this.webhookEmitter?.emit('opportunity.applied', {
      applicationId: input.externalId,
      ...input.data,
    });
  }
}
