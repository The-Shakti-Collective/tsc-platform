import { createHmac, randomBytes } from 'node:crypto';
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  WEBHOOK_DELIVERY_TIMEOUT_MS,
  type WebhookEventTypeValue,
} from '@tsc/database';
import type {
  WebhookDeliveriesListPayload,
  WebhookDeliveryRecord,
  WebhookSubscriptionCreatedPayload,
  WebhookSubscriptionSummary,
  WebhookTestPayload,
} from '@tsc/types';
import { WebhookRepository } from './webhook.repository';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly repository: WebhookRepository) {}

  async createSubscription(input: {
    apiKeyId: string;
    url: string;
    events: WebhookEventTypeValue[];
  }): Promise<WebhookSubscriptionCreatedPayload> {
    this.assertAvailable();
    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    const row = await this.repository.createSubscription({
      apiKeyId: input.apiKeyId,
      url: input.url,
      events: input.events,
      secret,
    });
    if (!row) throw new ServiceUnavailableException('Webhook subscription creation failed');

    return {
      ...this.toSummary(row),
      secret,
    };
  }

  async listSubscriptions(apiKeyId?: string): Promise<{
    items: WebhookSubscriptionSummary[];
    updatedAt: string;
  }> {
    this.assertAvailable();
    const rows = await this.repository.listSubscriptions({ apiKeyId });
    return {
      items: rows.map((row) => this.toSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteSubscription(id: string): Promise<WebhookSubscriptionSummary> {
    this.assertAvailable();
    const existing = await this.repository.findSubscriptionById(id);
    if (!existing) throw new NotFoundException(`Webhook subscription ${id} not found`);
    const row = await this.repository.deactivateSubscription(id);
    if (!row) throw new ServiceUnavailableException('Webhook subscription delete failed');
    return this.toSummary(row);
  }

  async sendTest(id: string): Promise<WebhookTestPayload> {
    this.assertAvailable();
    const subscription = await this.repository.findSubscriptionById(id);
    if (!subscription || !subscription.isActive) {
      throw new NotFoundException(`Active webhook subscription ${id} not found`);
    }

    const payload = {
      eventType: 'webhook.test',
      occurredAt: new Date().toISOString(),
      data: { message: 'TSC webhook test payload stub' },
    };

    const delivery = await this.repository.createDelivery({
      subscriptionId: subscription.id,
      eventType: 'webhook.test',
      payload,
    });
    if (!delivery) {
      throw new ServiceUnavailableException('Webhook test delivery creation failed');
    }

    const result = await this.deliverHttp(subscription.url, subscription.secret, payload);
    await this.repository.updateDelivery(delivery.id, {
      status: result.ok ? 'delivered' : 'failed',
      attempts: 1,
      responseCode: result.responseCode,
      deliveredAt: result.ok ? new Date() : null,
    });

    return {
      subscriptionId: subscription.id,
      deliveryId: delivery.id,
      eventType: 'webhook.test',
      status: result.ok ? 'delivered' : 'failed',
      responseCode: result.responseCode,
    };
  }

  async listDeliveries(input: {
    subscriptionId?: string;
    limit: number;
  }): Promise<WebhookDeliveriesListPayload> {
    this.assertAvailable();
    const rows = await this.repository.listDeliveries(input);
    return {
      items: rows.map((row) => this.toDeliveryRecord(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  private toSummary(row: {
    id: string;
    apiKeyId: string;
    url: string;
    events: string[];
    isActive: boolean;
    createdAt: Date;
  }): WebhookSubscriptionSummary {
    return {
      id: row.id,
      apiKeyId: row.apiKeyId,
      url: row.url,
      events: row.events as WebhookEventTypeValue[],
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toDeliveryRecord(row: {
    id: string;
    subscriptionId: string;
    eventType: string;
    payload: unknown;
    status: string;
    attempts: number;
    deliveredAt: Date | null;
    responseCode: number | null;
    createdAt: Date;
  }): WebhookDeliveryRecord {
    return {
      id: row.id,
      subscriptionId: row.subscriptionId,
      eventType: row.eventType,
      payload:
        row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
          ? (row.payload as Record<string, unknown>)
          : {},
      status: row.status as WebhookDeliveryRecord['status'],
      attempts: row.attempts,
      deliveredAt: row.deliveredAt?.toISOString() ?? null,
      responseCode: row.responseCode,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('WebhookSubscription model not migrated yet');
    }
  }

  /** HTTP POST delivery stub — exposed for WebhookEmitterService */
  async deliverHttp(
    url: string,
    secret: string,
    payload: Record<string, unknown>,
  ): Promise<{ ok: boolean; responseCode: number | null }> {
    const body = JSON.stringify(payload);
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_DELIVERY_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TSC-Webhook-Signature': signature,
          'User-Agent': 'TSC-Webhook/1.0',
        },
        body,
        signal: controller.signal,
      });

      const ok = response.status >= 200 && response.status < 300;
      if (!ok) {
        this.logger.warn(`Webhook delivery failed: HTTP ${response.status} → ${url}`);
      }
      return { ok, responseCode: response.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'fetch failed';
      this.logger.warn(`Webhook delivery error → ${url}: ${message}`);
      return { ok: false, responseCode: null };
    } finally {
      clearTimeout(timer);
    }
  }
}
