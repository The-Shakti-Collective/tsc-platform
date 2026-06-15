export type HealthStatus = 'ok' | 'degraded';

export type DependencyStatus = 'ok' | 'degraded' | 'unavailable' | 'not_configured';

export type HealthSummaryResponse = {
  status: HealthStatus;
  service: string;
  environment: string;
  timestamp: string;
};

export type LivenessResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
};

export type ReadinessResponse = {
  status: HealthStatus;
  service: string;
  checks: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
  timestamp: string;
};

export type DependencyProbeResponse = {
  status: DependencyStatus;
  service: string;
  timestamp: string;
};

export type StorageProbeResponse = DependencyProbeResponse & {
  bucket: string | null;
  configured: boolean;
};
