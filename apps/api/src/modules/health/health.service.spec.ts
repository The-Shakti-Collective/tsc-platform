import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../common/database/prisma.service';
import { QueueRegistryService } from '../../queues/queue-registry.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { client: { $queryRaw: ReturnType<typeof vi.fn> } };
  let queues: { pingRedis: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      client: {
        $queryRaw: vi.fn(),
      },
    };
    queues = {
      pingRedis: vi.fn(),
    };

    service = new HealthService(
      prisma as unknown as PrismaService,
      queues as unknown as QueueRegistryService,
    );
  });

  it('returns summary with environment and service metadata', () => {
    const result = service.getSummary();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('tsc-api');
    expect(result.environment).toBeTruthy();
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns liveness without dependency checks', () => {
    const result = service.getLiveness();

    expect(result).toEqual({
      status: 'ok',
      service: 'tsc-api',
      timestamp: expect.any(String),
    });
  });

  it('marks readiness ok when database and redis are healthy', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    queues.pingRedis.mockResolvedValue('ok');

    const result = await service.getReadiness();

    expect(result.status).toBe('ok');
    expect(result.checks).toEqual({ database: 'ok', redis: 'ok' });
    expect(service.isReadinessHealthy(result.checks)).toBe(true);
  });

  it('marks readiness degraded when database is unavailable', async () => {
    prisma.client.$queryRaw.mockRejectedValue(new Error('connection refused'));
    queues.pingRedis.mockResolvedValue('ok');

    const result = await service.getReadiness();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('unavailable');
    expect(service.isReadinessHealthy(result.checks)).toBe(false);
  });

  it('marks readiness degraded when redis is unavailable', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    queues.pingRedis.mockResolvedValue('unavailable');

    const result = await service.getReadiness();

    expect(result.status).toBe('degraded');
    expect(result.checks.redis).toBe('unavailable');
    expect(service.isReadinessHealthy(result.checks)).toBe(false);
  });

  it('allows degraded redis when redis is not configured', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    queues.pingRedis.mockResolvedValue('degraded');

    const result = await service.getReadiness();

    expect(result.status).toBe('ok');
    expect(result.checks.redis).toBe('degraded');
    expect(service.isReadinessHealthy(result.checks)).toBe(true);
  });
});
