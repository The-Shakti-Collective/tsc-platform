import { Injectable, Logger } from '@nestjs/common';
import type { SyncEventEnvelope } from '@tsc/contracts/sync';
import { SyncOutboundDispatcher } from './sync-outbound.dispatcher';

/**
 * Emits TSC-side sync events (e.g. marketplace apply → CoreKnot CRM).
 * Uses shared @tsc/contracts/sync envelope.
 */
@Injectable()
export class SyncEmitter {
  private readonly logger = new Logger(SyncEmitter.name);

  constructor(private readonly outbound: SyncOutboundDispatcher) {}

  async emit(event: SyncEventEnvelope): Promise<void> {
    try {
      await this.outbound.dispatch(event);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Outbound sync failed';
      this.logger.warn(`${event.eventType} outbound failed: ${message}`);
    }
  }
}
