import { Injectable, Logger } from '@nestjs/common';

export interface IdentitySyncEventPayload {
  type:
    | 'identity.resolved'
    | 'identity.merged'
    | 'identity.person360.requested';
  sourceSystem: 'tsc';
  externalId: string;
  entityType: 'Person' | 'PersonIdentifier' | 'IdentityMergeLog';
  data: Record<string, unknown>;
}

/**
 * Stub emitter for Sync Layer + Artist Passport agents (Phase 6).
 * Replace with queue/webhook dispatch when sync module is wired.
 */
@Injectable()
export class IdentitySyncEmitter {
  private readonly logger = new Logger(IdentitySyncEmitter.name);

  emit(event: IdentitySyncEventPayload): void {
    this.logger.log(
      `[sync-stub] ${event.type} entity=${event.entityType} id=${event.externalId}`,
    );
  }
}
