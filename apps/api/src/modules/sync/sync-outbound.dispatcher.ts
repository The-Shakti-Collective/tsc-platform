import { Injectable, Logger, Optional } from '@nestjs/common';
import type { SyncEventEnvelope } from '@tsc/contracts/sync';

export interface OutboundSyncDispatchOptions {
  baseUrl?: string;
}

/**
 * Outbound sync dispatcher — TSC → CoreKnot (or replay).
 * Wire to queue/webhook when CoreKnot inbound endpoint exists.
 */
@Injectable()
export class SyncOutboundDispatcher {
  private readonly logger = new Logger(SyncOutboundDispatcher.name);

  constructor(
    @Optional() private readonly options: OutboundSyncDispatchOptions = {},
  ) {}

  async dispatch(event: SyncEventEnvelope): Promise<void> {
    const baseUrl =
      this.options.baseUrl ??
      process.env.COREKNOT_SYNC_URL ??
      process.env.COREKNOT_API_URL;

    if (!baseUrl) {
      this.logger.log(
        `[sync-outbound-stub] ${event.eventType} externalId=${event.externalId}`,
      );
      return;
    }

    const url = `${baseUrl.replace(/\/$/, '')}/api/sync/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.COREKNOT_SYNC_SECRET
          ? { 'x-sync-secret': process.env.COREKNOT_SYNC_SECRET }
          : {}),
      },
      body: JSON.stringify({ events: [{ ...event, sourceSystem: 'tsc' }] }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`CoreKnot sync dispatch failed (${response.status}): ${text}`);
    }
  }
}
