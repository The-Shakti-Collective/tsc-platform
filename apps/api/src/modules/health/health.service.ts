import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';
import { QueueRegistryService } from '../../queues/queue-registry.service';
import type {
  DependencyProbeResponse,
  DependencyStatus,
  HealthSummaryResponse,
  LivenessResponse,
  ReadinessResponse,
  StorageProbeResponse,
} from './health.types';

const SERVICE_NAME = 'tsc-api';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueRegistryService,
  ) {}

  getSummary(): HealthSummaryResponse {
    return {
      status: 'ok',
      service: SERVICE_NAME,
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const checks = {
      database: await this.probeDatabase(),
      redis: await this.queues.pingRedis(),
    };

    const healthy =
      checks.database === 'ok' && checks.redis !== 'unavailable';

    return {
      status: healthy ? 'ok' : 'degraded',
      service: SERVICE_NAME,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  isReadinessHealthy(checks: ReadinessResponse['checks']): boolean {
    return checks.database === 'ok' && checks.redis !== 'unavailable';
  }

  async checkDatabase(): Promise<DependencyProbeResponse> {
    const status = await this.probeDatabase();
    return this.dependencyResponse(status);
  }

  async checkRedis(): Promise<DependencyProbeResponse> {
    const status = await this.queues.pingRedis();
    return this.dependencyResponse(status);
  }

  async checkStorage(): Promise<StorageProbeResponse> {
    const bucket = process.env.R2_BUCKET?.trim() ?? null;
    const configured = Boolean(
      process.env.R2_ACCESS_KEY_ID?.trim() &&
        process.env.R2_SECRET_ACCESS_KEY?.trim() &&
        bucket,
    );

    let status: DependencyStatus = 'not_configured';
    if (configured) {
      status = process.env.R2_ENDPOINT?.trim() ? 'ok' : 'degraded';
    }

    return {
      status,
      service: SERVICE_NAME,
      bucket,
      configured,
      timestamp: new Date().toISOString(),
    };
  }

  private dependencyResponse(status: DependencyStatus): DependencyProbeResponse {
    return {
      status,
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
    };
  }

  private async probeDatabase(): Promise<DependencyStatus> {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'unavailable';
    }
  }
}
