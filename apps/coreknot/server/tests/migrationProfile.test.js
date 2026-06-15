const ORIGINAL_ENV = { ...process.env };

describe('migrationProfile', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  function loadProfile() {
    return require('../infrastructure/postgres/migrationProfile');
  }

  it('requires all P0 flags for areAllP0StoresOnPostgres', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.COREKNOT_POSTGRES_ENABLED = 'true';
    process.env.COREKNOT_AUTH_STORE = 'postgres';
    process.env.COREKNOT_TENANT_STORE = 'postgres';
    process.env.COREKNOT_PROJECTS_STORE = 'postgres';
    process.env.COREKNOT_TASKS_STORE = 'postgres';
    process.env.COREKNOT_CRM_STORE = 'postgres';
    process.env.COREKNOT_ARTISTS_STORE = 'postgres';

    const { areAllP0StoresOnPostgres, useNeonBackupStrategy } = loadProfile();
    expect(areAllP0StoresOnPostgres()).toBe(true);
    process.env.COREKNOT_DISABLE_GRIDFS_BACKUP = 'true';
    expect(useNeonBackupStrategy()).toBe(true);
  });

  it('validateProductionCutover fails without DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    const { validateProductionCutover } = loadProfile();
    const result = validateProductionCutover();
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'NO_DATABASE_URL')).toBe(true);
  });

  it('warns when Supabase secondary is enabled', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    process.env.COREKNOT_POSTGRES_ENABLED = 'true';
    process.env.COREKNOT_AUTH_STORE = 'postgres';
    process.env.COREKNOT_TENANT_STORE = 'postgres';
    process.env.COREKNOT_PROJECTS_STORE = 'postgres';
    process.env.COREKNOT_TASKS_STORE = 'postgres';
    process.env.COREKNOT_CRM_STORE = 'postgres';
    process.env.COREKNOT_ARTISTS_STORE = 'postgres';
    process.env.SUPABASE_SECONDARY_ENABLED = 'true';

    const { validateProductionCutover } = loadProfile();
    const result = validateProductionCutover();
    expect(result.issues.some((i) => i.code === 'SUPABASE_ENABLED')).toBe(true);
  });
});

describe('databaseBackupService destination', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('returns neon when BACKUP_DESTINATION=neon', () => {
    process.env.BACKUP_DESTINATION = 'neon';
    const { getBackupDestination } = require('../services/databaseBackupService');
    expect(getBackupDestination()).toBe('neon');
  });
});
