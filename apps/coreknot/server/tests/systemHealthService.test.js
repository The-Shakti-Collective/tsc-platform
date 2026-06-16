jest.mock('../config', () => ({
  config: { isProduction: true },
}));

jest.mock('../services/mongoConnectionService', () => ({
  connectMongo: jest.fn(),
  isMongoReady: jest.fn(() => false),
}));

jest.mock('../infrastructure/postgres/migrationProfile', () => ({
  areAllP0StoresOnPostgres: jest.fn(() => true),
}));

const mockPingPostgres = jest.fn();
const mockDisconnectPostgres = jest.fn(() => Promise.resolve());

jest.mock('../infrastructure/postgres/prismaClient', () => ({
  isMongoRequired: jest.fn(() => false),
  isPostgresConfigured: jest.fn(() => true),
  pingPostgres: (...args) => mockPingPostgres(...args),
  disconnectPostgres: (...args) => mockDisconnectPostgres(...args),
}));

const SystemHealthService = require('../services/SystemHealthService');

describe('SystemHealthService maintenance gate', () => {
  beforeEach(() => {
    SystemHealthService.resetStateForTests();
    mockPingPostgres.mockReset();
    mockDisconnectPostgres.mockReset();
    mockDisconnectPostgres.mockResolvedValue(undefined);
  });

  it('does not enter FAIL until consecutive dependency checks fail', async () => {
    mockPingPostgres.mockResolvedValue({ ok: false, reason: 'connection timeout' });

    await SystemHealthService.checkDependencies();
    expect(SystemHealthService.getStatus().status).toBe('DEGRADED');

    await SystemHealthService.checkDependencies();
    expect(SystemHealthService.getStatus().status).toBe('DEGRADED');

    await SystemHealthService.checkDependencies();
    expect(SystemHealthService.getStatus().status).toBe('FAIL');
  });

  it('recovers to HEALTHY immediately after postgres ping succeeds', async () => {
    mockPingPostgres.mockResolvedValue({ ok: false, reason: 'down' });
    await SystemHealthService.checkDependencies();
    await SystemHealthService.checkDependencies();
    await SystemHealthService.checkDependencies();
    expect(SystemHealthService.getStatus().status).toBe('FAIL');

    mockPingPostgres.mockResolvedValue({ ok: true });
    await SystemHealthService.checkDependencies();
    expect(SystemHealthService.getStatus().status).toBe('HEALTHY');
  });

  it('middleware blocks only when status is FAIL in production', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    SystemHealthService.middleware({}, res, next);
    expect(next).toHaveBeenCalled();

    SystemHealthService.resetStateForTests();
    mockPingPostgres.mockResolvedValue({ ok: false, reason: 'down' });
    return SystemHealthService.checkDependencies()
      .then(() => SystemHealthService.checkDependencies())
      .then(() => SystemHealthService.checkDependencies())
      .then(() => {
        next.mockReset();
        res.status.mockClear();
        SystemHealthService.middleware({}, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'SERVICE_UNAVAILABLE',
            message: '503 Service Unavailable: Maintenance Mode',
          }),
        );
      });
  });
});
