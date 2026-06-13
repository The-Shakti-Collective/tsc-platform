import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service';
import { QueueRegistryService } from '../../queues/queue-registry.service';
import type {
  DependencyStatus,
  HealthSummaryResponse,
  LivenessResponse,
  ReadinessResponse,
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
      database: await this.checkDatabase(),
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

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'unavailable';
    }
  }
}
