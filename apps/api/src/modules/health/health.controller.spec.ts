import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: {
    getSummary: ReturnType<typeof vi.fn>;
    getLiveness: ReturnType<typeof vi.fn>;
    getReadiness: ReturnType<typeof vi.fn>;
    isReadinessHealthy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    healthService = {
      getSummary: vi.fn(),
      getLiveness: vi.fn(),
      getReadiness: vi.fn(),
      isReadinessHealthy: vi.fn(),
    };

    controller = new HealthController(healthService as unknown as HealthService);
  });

  it('returns summary from service', () => {
    const summary = {
      status: 'ok',
      service: 'tsc-api',
      environment: 'test',
      timestamp: '2026-06-13T12:00:00.000Z',
    };
    healthService.getSummary.mockReturnValue(summary);

    expect(controller.health()).toEqual(summary);
  });

  it('returns liveness from service', () => {
    const liveness = {
      status: 'ok',
      service: 'tsc-api',
      timestamp: '2026-06-13T12:00:00.000Z',
    };
    healthService.getLiveness.mockReturnValue(liveness);

    expect(controller.liveness()).toEqual(liveness);
  });

  it('returns readiness when dependencies are healthy', async () => {
    const readiness = {
      status: 'ok',
      service: 'tsc-api',
      checks: { database: 'ok', redis: 'ok' },
      timestamp: '2026-06-13T12:00:00.000Z',
    };
    healthService.getReadiness.mockResolvedValue(readiness);
    healthService.isReadinessHealthy.mockReturnValue(true);

    await expect(controller.readiness()).resolves.toEqual(readiness);
  });

  it('throws 503 when readiness dependencies are unhealthy', async () => {
    const readiness = {
      status: 'degraded',
      service: 'tsc-api',
      checks: { database: 'unavailable', redis: 'ok' },
      timestamp: '2026-06-13T12:00:00.000Z',
    };
    healthService.getReadiness.mockResolvedValue(readiness);
    healthService.isReadinessHealthy.mockReturnValue(false);

    await expect(controller.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
