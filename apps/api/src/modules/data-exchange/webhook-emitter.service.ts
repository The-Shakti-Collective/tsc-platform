import { Injectable, Logger } from '@nestjs/common';
import type { WebhookEventTypeValue } from '@tsc/database';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';

export interface WebhookEmitPayload {
  eventType: WebhookEventTypeValue;
  occurredAt: string;
  data: Record<string, unknown>;
}

/**
 * Dispatches partner webhook events from sync/activity hooks.
 * HTTP POST stub — logs payload, marks delivered/failed (no retry queue).
 */
@Injectable()
export class WebhookEmitterService {
  private readonly logger = new Logger(WebhookEmitterService.name);

  constructor(
    private readonly repository: WebhookRepository,
    private readonly webhookService: WebhookService,
  ) {}

  emit(eventType: WebhookEventTypeValue, data: Record<string, unknown>): void {
    if (!this.repository.isAvailable()) return;

    const payload: WebhookEmitPayload = {
      eventType,
      occurredAt: new Date().toISOString(),
      data,
    };

    void this.dispatch(eventType, payload).catch((err) => {
      this.logger.warn(`${eventType} webhook dispatch failed: ${err}`);
    });
  }

  private async dispatch(
    eventType: WebhookEventTypeValue,
    payload: WebhookEmitPayload,
  ): Promise<void> {
    const subscriptions = await this.repository.findActiveByEvent(eventType);
    if (subscriptions.length === 0) return;

    this.logger.debug(
      `Dispatching ${eventType} to ${subscriptions.length} webhook subscription(s)`,
    );

    await Promise.all(
      subscriptions.map(async (subscription) => {
        const delivery = await this.repository.createDelivery({
          subscriptionId: subscription.id,
          eventType,
          payload: payload as unknown as Record<string, unknown>,
        });
        if (!delivery) return;

        const result = await this.webhookService.deliverHttp(
          subscription.url,
          subscription.secret,
          payload as unknown as Record<string, unknown>,
        );

        await this.repository.updateDelivery(delivery.id, {
          status: result.ok ? 'delivered' : 'failed',
          attempts: 1,
          responseCode: result.responseCode,
          deliveredAt: result.ok ? new Date() : null,
        });
      }),
    );
  }
}
