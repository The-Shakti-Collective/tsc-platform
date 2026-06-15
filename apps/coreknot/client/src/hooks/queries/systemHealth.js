import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const SYSTEM_HEALTH_REFRESH_MS = 30_000;

export const useSystemHealth = (options = {}) => {
  const enabled = options.enabled !== false;
  const poll = options.poll !== false;

  return useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: async () => {
      try {
        const { data } = await axios.get('/api/admin/system-health');
        const report = data?.data ?? data;
        if (!report || typeof report !== 'object') {
          return {
            status: 'down',
            ok: false,
            services: [],
            checkedAt: new Date().toISOString(),
          };
        }
        return {
          status: report.status || 'degraded',
          ok: report.ok ?? report.status === 'ok',
          checkedAt: report.checkedAt,
          uptimeSeconds: report.uptimeSeconds,
          environment: report.environment,
          services: Array.isArray(report.services) ? report.services : [],
        };
      } catch {
        return {
          status: 'down',
          ok: false,
          services: [],
          checkedAt: new Date().toISOString(),
        };
      }
    },
    enabled,
    staleTime: 10_000,
    refetchInterval: poll ? SYSTEM_HEALTH_REFRESH_MS : false,
    refetchOnWindowFocus: true,
  });
};
