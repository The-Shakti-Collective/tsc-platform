const { aggregateStatus } = require('../services/systemHealthProbeService');

describe('systemHealthProbeService aggregateStatus', () => {
  it('returns ok when only optional services are skipped', () => {
    const status = aggregateStatus([
      { id: 'mongodb', status: 'ok' },
      { id: 'redis', status: 'skipped' },
      { id: 'supabase', status: 'skipped' },
      { id: 'resend', status: 'skipped' },
    ]);
    expect(status).toBe('ok');
  });

  it('returns degraded when a required service is degraded', () => {
    const status = aggregateStatus([
      { id: 'mongodb', status: 'ok' },
      { id: 'tsc-api', status: 'degraded' },
    ]);
    expect(status).toBe('degraded');
  });

  it('returns down when mongodb is down', () => {
    const status = aggregateStatus([
      { id: 'mongodb', status: 'down' },
      { id: 'redis', status: 'skipped' },
    ]);
    expect(status).toBe('down');
  });

  it('ignores skipped redis when aggregating', () => {
    const status = aggregateStatus([
      { id: 'mongodb', status: 'ok' },
      { id: 'redis', status: 'skipped' },
      { id: 'crm-api', status: 'ok' },
    ]);
    expect(status).toBe('ok');
  });
});
