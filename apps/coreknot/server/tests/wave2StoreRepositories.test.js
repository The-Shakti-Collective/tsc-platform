const {
  isPostgresStoreEnabled,
  isPostgresMailEnabled,
  isPostgresDataHubEnabled,
  isPostgresAttendanceEnabled,
} = require('../infrastructure/postgres/prismaClient');

describe('Wave 2 postgres store flags', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tsc_community';
    process.env.COREKNOT_POSTGRES_ENABLED = 'true';
  });

  afterAll(() => {
    process.env = env;
  });

  it('defaults Wave 2 domains to mongo', () => {
    delete process.env.COREKNOT_MAIL_STORE;
    delete process.env.COREKNOT_DATAHUB_STORE;
    expect(isPostgresMailEnabled()).toBe(false);
    expect(isPostgresDataHubEnabled()).toBe(false);
  });

  it('enables Wave 2 domain when flag is postgres', () => {
    process.env.COREKNOT_ATTENDANCE_STORE = 'postgres';
    expect(isPostgresAttendanceEnabled()).toBe(true);
  });
});

describe('Wave 2 legacy repositories', () => {
  it('exports dual-store helpers', () => {
    const { mailCampaignRepository, campaignRepository } = require('../repositories/mailRepositories');
    const attendanceRepository = require('../repositories/attendanceRepository');
    expect(typeof mailCampaignRepository.find).toBe('function');
    expect(typeof mailCampaignRepository.isPostgresEnabled).toBe('function');
    expect(typeof campaignRepository.create).toBe('function');
    expect(typeof attendanceRepository.create).toBe('function');
  });
});

describe('dual-write staff user repository', () => {
  it('exports createStaffUser and deleteStaffUser', () => {
    const staffUserRepository = require('../repositories/staffUserRepository');
    expect(typeof staffUserRepository.createStaffUser).toBe('function');
    expect(typeof staffUserRepository.deleteStaffUser).toBe('function');
    expect(typeof staffUserRepository.touchStaffUserLastOnline).toBe('function');
  });
});
