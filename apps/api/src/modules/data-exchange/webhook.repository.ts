import { Injectable } from '@nestjs/common';
import {
  dataExchangePartnerPublicSelect,
  webhookDeliveryPublicSelect,
  webhookSubscriptionListWhere,
  webhookSubscriptionPublicSelect,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';

type WebhookSubscriptionRow = {
  id: string;
  apiKeyId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
};

type WebhookDeliveryRow = {
  id: string;
  subscriptionId: string;
  eventType: string;
  payload: unknown;
  status: string;
  attempts: number;
  deliveredAt: Date | null;
  responseCode: number | null;
  createdAt: Date;
};

type DataExchangePartnerRow = {
  id: string;
  name: string;
  slug: string;
  apiKeyId: string;
  allowedScopes: string[];
  syncDirection: string;
  config: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WebhookRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('webhookSubscription') != null;
  }

  listSubscriptions(input: { apiKeyId?: string }) {
    const model = this.client('webhookSubscription') as {
      findMany: (args: unknown) => Promise<WebhookSubscriptionRow[]>;
    } | null;
    if (!model) return Promise.resolve([]);
    return model.findMany({
      where: webhookSubscriptionListWhere({ ...input, isActive: true }),
      select: webhookSubscriptionPublicSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findSubscriptionById(id: string) {
    const model = this.client('webhookSubscription') as {
      findUnique: (args: unknown) => Promise<WebhookSubscriptionRow | null>;
    } | null;
    if (!model) return Promise.resolve(null);
    return model.findUnique({ where: { id } });
  }

  findActiveByEvent(eventType: string) {
    const model = this.client('webhookSubscription') as {
      findMany: (args: unknown) => Promise<WebhookSubscriptionRow[]>;
    } | null;
    if (!model) return Promise.resolve([]);
    return model.findMany({
      where: {
        isActive: true,
        events: { has: eventType },
      },
    });
  }

  createSubscription(input: {
    apiKeyId: string;
    url: string;
    events: string[];
    secret: string;
  }) {
    const model = this.client('webhookSubscription') as {
      create: (args: unknown) => Promise<WebhookSubscriptionRow>;
    } | null;
    if (!model) return Promise.resolve(null);
    return model.create({
      data: {
        id: newId(),
        apiKeyId: input.apiKeyId,
        url: input.url,
        events: input.events,
        secret: input.secret,
        isActive: true,
      },
    });
  }

  deactivateSubscription(id: string) {
    const model = this.client('webhookSubscription') as {
      update: (args: unknown) => Promise<WebhookSubscriptionRow>;
    } | null;
    if (!model) return Promise.resolve(null);
    return model.update({
      where: { id },
      data: { isActive: false },
    });
  }

  createDelivery(input: {
    subscriptionId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }) {
    const model = this.client('webhookDelivery') as {
      create: (args: unknown) => Promise<WebhookDeliveryRow>;
    } | null;
    if (!model) return Promise.resolve(null);
    return model.create({
      data: {
        id: newId(),
        subscriptionId: input.subscriptionId,
        eventType: input.eventType,
        payload: toInputJson(input.payload),
        status: 'pending',
        attempts: 0,
      },
    });
  }

  updateDelivery(
    id: string,
    input: {
      status: 'delivered' | 'failed';
      attempts: number;
      responseCode?: number | null;
      deliveredAt?: Date | null;
    },
  ) {
    const model = this.client('webhookDelivery') as {
      update: (args: unknown) => Promise<WebhookDeliveryRow>;
    } | null;
    if (!model) return Promise.resolve(null);
    return model.update({
      where: { id },
      data: {
        status: input.status,
        attempts: input.attempts,
        responseCode: input.responseCode ?? null,
        deliveredAt: input.deliveredAt ?? null,
      },
    });
  }

  listDeliveries(input: { subscriptionId?: string; limit: number }) {
    const model = this.client('webhookDelivery') as {
      findMany: (args: unknown) => Promise<WebhookDeliveryRow[]>;
    } | null;
    if (!model) return Promise.resolve([]);
    const where = input.subscriptionId ? { subscriptionId: input.subscriptionId } : {};
    return model.findMany({
      where,
      select: webhookDeliveryPublicSelect,
      orderBy: { createdAt: 'desc' },
      take: input.limit,
    });
  }
}

@Injectable()
export class ExchangePartnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(field: string): unknown {
    return (this.prisma.client as unknown as Record<string, unknown>)[field] ?? null;
  }

  isAvailable(): boolean {
    return this.client('dataExchangePartner') != null;
  }

  findBySlug(slug: string) {
    const model = this.client('dataExchangePartner') as {
      findUnique: (args: unknown) => Promise<DataExchangePartnerRow | null>;
    } | null;
    if (!model) return Promise.resolve(null);
    return model.findUnique({ where: { slug } });
  }

  create(input: {
    name: string;
    slug: string;
    apiKeyId: string;
    allowedScopes: string[];
    syncDirection: string;
    config: Record<string, unknown>;
  }) {
    const model = this.client('dataExchangePartner') as {
      create: (args: unknown) => Promise<DataExchangePartnerRow>;
    } | null;
    if (!model) return Promise.resolve(null);
    return model.create({
      data: {
        id: newId(),
        name: input.name,
        slug: input.slug,
        apiKeyId: input.apiKeyId,
        allowedScopes: input.allowedScopes,
        syncDirection: input.syncDirection,
        config: toInputJson(input.config),
        isActive: true,
      },
      select: dataExchangePartnerPublicSelect,
    });
  }
}
