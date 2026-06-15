import { Injectable } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { TypesenseService } from '../search/typesense.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly healthService: HealthService,
    private readonly typesense: TypesenseService,
  ) {}

  getSystemHealth() {
    return this.healthService.getSummary();
  }

  async getSystemHealthDetailed() {
    const readiness = await this.healthService.getReadiness();
    const storage = await this.healthService.checkStorage();

    return {
      status: this.healthService.isReadinessHealthy(readiness.checks) ? 'HEALTHY' : 'DEGRADED',
      dependencies: {
        database: readiness.checks.database,
        redis: readiness.checks.redis,
        storage: storage.status,
        typesense: this.typesense.getHealth().status,
      },
      timestamp: new Date().toISOString(),
      stub: false,
    };
  }

  listRoles() {
    return {
      orgRoles: [
        { id: 'SUPER_ADMIN', name: 'Super Admin', system: true },
        { id: 'ORG_OWNER', name: 'Org Owner', system: true },
        { id: 'MANAGER', name: 'Manager', system: true },
        { id: 'ARTIST', name: 'Artist', system: true },
        { id: 'TEAM_MEMBER', name: 'Team Member', system: true },
      ],
      projectRoles: [
        { id: 'owner', name: 'Owner', system: true },
        { id: 'lead', name: 'Lead', system: true },
        { id: 'member', name: 'Member', system: true },
      ],
      stub: true,
    };
  }

  listScripts() {
    return {
      data: [
        { id: 'reindex-search', name: 'Reindex Typesense', description: 'Stub — not runnable yet' },
        { id: 'sync-royalties', name: 'Sync royalty statements', description: 'Stub — not runnable yet' },
      ],
      stub: true,
    };
  }

  getQueueStatus() {
    return {
      queues: ['tsc.feed', 'tsc.reputation', 'tsc.graph', 'tsc.recommendation'],
      status: 'stub',
      message: 'Use BullMQ dashboard / Railway logs for live queue metrics',
    };
  }
}
