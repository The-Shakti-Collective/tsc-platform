import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import {
  FEED_JOB_NAMES,
  GRAPH_JOB_NAMES,
  QUEUE_NAMES,
  RECOMMENDATION_JOB_NAMES,
  REPUTATION_JOB_NAMES,
} from './queue-names';

/** BullMQ producer registry — feed, reputation, graph, recommendation (see QUEUE_NAMES). */
@Injectable()
export class QueueRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueRegistryService.name);
  private readonly connection: IORedis | null;
  readonly feed: Queue | null;
  readonly reputation: Queue | null;
  readonly graph: Queue | null;
  readonly recommendation: Queue | null;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.connection = null;
      this.feed = null;
      this.reputation = null;
      this.graph = null;
      this.recommendation = null;
      return;
    }

    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    const connection = this.connection as unknown as ConnectionOptions;
    this.feed = new Queue(QUEUE_NAMES.feed, { connection });
    this.reputation = new Queue(QUEUE_NAMES.reputation, {
      connection,
    });
    this.graph = new Queue(QUEUE_NAMES.graph, { connection });
    this.recommendation = new Queue(QUEUE_NAMES.recommendation, {
      connection,
    });
  }

  async enqueueFeedStub(name: keyof typeof FEED_JOB_NAMES, data: Record<string, unknown>) {
    if (!this.feed) return null;
    return this.feed.add(FEED_JOB_NAMES[name], data, { removeOnComplete: 100 });
  }

  async enqueueReputationStub(
    name: keyof typeof REPUTATION_JOB_NAMES,
    data: Record<string, unknown>,
  ) {
    if (!this.reputation) return null;
    return this.reputation.add(REPUTATION_JOB_NAMES[name], data, {
      removeOnComplete: 100,
    });
  }

  async enqueueGraphStub(name: keyof typeof GRAPH_JOB_NAMES, data: Record<string, unknown>) {
    if (!this.graph) return null;
    return this.graph.add(GRAPH_JOB_NAMES[name], data, { removeOnComplete: 100 });
  }

  async enqueueRecommendationStub(
    name: keyof typeof RECOMMENDATION_JOB_NAMES,
    data: Record<string, unknown>,
  ) {
    if (!this.recommendation) return null;
    return this.recommendation.add(RECOMMENDATION_JOB_NAMES[name], data, {
      removeOnComplete: 100,
    });
  }

  onModuleInit(): void {
    const status = this.getQueueStatus();
    if (status.mode === 'stub') {
      this.logger.warn('REDIS_URL unset — BullMQ stub mode (enqueue calls no-op)');
      return;
    }

    this.logger.log(`BullMQ queues registered: ${status.queues.join(', ')}`);
  }

  /** Registered queue names, or stub mode when REDIS_URL is unset. */
  getQueueStatus(): { mode: 'connected' | 'stub'; queues: string[] } {
    if (!this.connection) {
      return { mode: 'stub', queues: [] };
    }

    return {
      mode: 'connected',
      queues: [
        QUEUE_NAMES.feed,
        QUEUE_NAMES.reputation,
        QUEUE_NAMES.graph,
        QUEUE_NAMES.recommendation,
      ],
    };
  }

  /** Lightweight Redis connectivity check for readiness probes. */
  async pingRedis(): Promise<'ok' | 'degraded' | 'unavailable'> {
    if (!process.env.REDIS_URL) {
      return 'degraded';
    }

    if (!this.connection) {
      return 'unavailable';
    }

    try {
      const pong = await this.connection.ping();
      return pong === 'PONG' ? 'ok' : 'degraded';
    } catch {
      return 'unavailable';
    }
  }

  async onModuleDestroy() {
    await Promise.all([
      this.feed?.close(),
      this.reputation?.close(),
      this.graph?.close(),
      this.recommendation?.close(),
      this.connection?.quit(),
    ]);
  }
}
