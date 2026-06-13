export type HealthStatus = 'ok' | 'degraded';

export type DependencyStatus = 'ok' | 'degraded' | 'unavailable';

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
