const {
  isPostgresProjectsEnabled,
  isPostgresTasksEnabled,
  isPostgresCrmEnabled,
  isPostgresStoreEnabled,
} = require('../infrastructure/postgres/prismaClient');

describe('postgres store flags', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tsc_community';
    process.env.COREKNOT_POSTGRES_ENABLED = 'true';
  });

  afterAll(() => {
    process.env = env;
  });

  it('defaults to mongo when domain flags unset', () => {
    delete process.env.COREKNOT_PROJECTS_STORE;
    delete process.env.COREKNOT_TASKS_STORE;
    delete process.env.COREKNOT_CRM_STORE;
    expect(isPostgresProjectsEnabled()).toBe(false);
    expect(isPostgresTasksEnabled()).toBe(false);
    expect(isPostgresCrmEnabled()).toBe(false);
  });

  it('enables domain when flag is postgres', () => {
    process.env.COREKNOT_PROJECTS_STORE = 'postgres';
    process.env.COREKNOT_TASKS_STORE = 'postgres';
    process.env.COREKNOT_CRM_STORE = 'postgres';
    expect(isPostgresProjectsEnabled()).toBe(true);
    expect(isPostgresTasksEnabled()).toBe(true);
    expect(isPostgresCrmEnabled()).toBe(true);
  });

  it('disables all stores when master switch is false', () => {
    process.env.COREKNOT_PROJECTS_STORE = 'postgres';
    process.env.COREKNOT_POSTGRES_ENABLED = 'false';
    expect(isPostgresStoreEnabled('COREKNOT_PROJECTS_STORE')).toBe(false);
  });
});

describe('dual-store repositories', () => {
  it('projectRepository exports mongo fallback helpers', () => {
    const projectRepository = require('../repositories/projectRepository');
    expect(typeof projectRepository.find).toBe('function');
    expect(typeof projectRepository.isPostgresProjectsEnabled).toBe('function');
  });

  it('taskRepository exports mongo fallback helpers', () => {
    const taskRepository = require('../repositories/taskRepository');
    expect(typeof taskRepository.aggregate).toBe('function');
    expect(typeof taskRepository.isPostgresTasksEnabled).toBe('function');
  });

  it('leadRepository exports mongo fallback helpers', () => {
    const leadRepository = require('../repositories/leadRepository');
    expect(typeof leadRepository.findPostgresLeadsPaginated).toBe('function');
    expect(typeof leadRepository.isPostgresCrmEnabled).toBe('function');
  });
});
