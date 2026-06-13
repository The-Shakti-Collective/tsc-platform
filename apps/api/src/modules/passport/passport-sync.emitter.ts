import { Injectable, Logger, Optional } from '@nestjs/common';
import { WebhookEmitterService } from '../data-exchange/webhook-emitter.service';
export interface ArtistCreatedSyncPayload {
  artistId: string;
  slug: string;
  displayName?: string | null;
}

/**
 * Sync Layer hook — auto-create passport stub when artist is created (Phase 6 Deliverable 6).
 * Phase 10.5: also emits partner webhook artist.created.
 */
@Injectable()
export class PassportSyncEmitter {
  private readonly logger = new Logger(PassportSyncEmitter.name);

  constructor(
    @Optional() private readonly webhookEmitter?: WebhookEmitterService,
  ) {}

  emitArtistCreated(event: ArtistCreatedSyncPayload): void {
    this.logger.log(
      `[sync-stub] artist.created artist=${event.artistId} slug=${event.slug}`,
    );

    this.webhookEmitter?.emit('artist.created', {
      artistId: event.artistId,
      slug: event.slug,
      displayName: event.displayName ?? null,
    });
  }
}
