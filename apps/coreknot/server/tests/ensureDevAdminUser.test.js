const User = require('../models/User');
const Department = require('../models/Department');
const {
  ensureDevAdminUser,
  resolveDevAccounts,
  resolveDevBypassEmail,
  DEV_BYPASS_DEFAULT_EMAIL,
} = require('../utils/ensureDevAdminUser');
const { seedDepartments } = require('../services/departmentService');
const { ADMIN_SLUG } = require('../utils/departmentPermissions');
const { getDefaultSeedPassword } = require('../utils/defaultPassword');

describe('ensureDevAdminUser', () => {
  const envKeys = ['ADMIN_EMAIL', 'DEV_BOOTSTRAP_EMAILS', 'DEV_BYPASS_EMAIL', 'SKIP_DEV_ADMIN_BOOTSTRAP'];
  let savedEnv;

  beforeEach(() => {
    savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
    process.env.NODE_ENV = 'test';
    delete process.env.SKIP_DEV_ADMIN_BOOTSTRAP;
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  it('resolveDevAccounts excludes ADMIN_EMAIL unless listed in DEV_BOOTSTRAP_EMAILS', () => {
    process.env.ADMIN_EMAIL = 'raghavraj@theshakticollective.in';
    delete process.env.DEV_BOOTSTRAP_EMAILS;

    const emails = resolveDevAccounts().map((a) => a.email);
    expect(emails).not.toContain('raghavraj@theshakticollective.in');
    expect(emails).toContain('dev-admin@example.com');
  });

  it('resolveDevAccounts includes ADMIN_EMAIL when explicitly in DEV_BOOTSTRAP_EMAILS', () => {
    process.env.ADMIN_EMAIL = 'raghavraj@theshakticollective.in';
    process.env.DEV_BOOTSTRAP_EMAILS = 'raghavraj@theshakticollective.in';

    const emails = resolveDevAccounts().map((a) => a.email);
    expect(emails).toContain('raghavraj@theshakticollective.in');
  });

  it('resolveDevBypassEmail defaults to dev-admin@example.com', () => {
    delete process.env.DEV_BYPASS_EMAIL;
    expect(resolveDevBypassEmail()).toBe(DEV_BYPASS_DEFAULT_EMAIL);
  });

  it('does not mutate an existing real user when ADMIN_EMAIL matches their address', async () => {
    process.env.ADMIN_EMAIL = 'founder@theshakticollective.in';
    delete process.env.DEV_BOOTSTRAP_EMAILS;

    await seedDepartments();
    const salesDept = await Department.findOne({ slug: 'sales' });
    expect(salesDept).toBeTruthy();

    const originalName = 'Raghav Raj Sobti';
    const user = await User.create({
      name: originalName,
      email: 'founder@theshakticollective.in',
      password: 'UniqueProdPassword!9',
      gender: 'male',
      departmentId: salesDept._id,
    });

    await ensureDevAdminUser();

    const refreshed = await User.findById(user._id).select('+password');
    expect(refreshed.name).toBe(originalName);
    expect(refreshed.departmentId.toString()).toBe(salesDept._id.toString());
    expect(await refreshed.comparePassword('UniqueProdPassword!9')).toBe(true);
    expect(await refreshed.comparePassword(getDefaultSeedPassword())).toBe(false);
  });

  it('creates and maintains seeded dev-admin@example.com account', async () => {
    await ensureDevAdminUser();

    const devAdmin = await User.findOne({ email: 'dev-admin@example.com' }).select('+password');
    expect(devAdmin).toBeTruthy();
    expect(devAdmin.name).toBe('Dev Admin');
    expect(await devAdmin.comparePassword(getDefaultSeedPassword())).toBe(true);

    const adminDept = await Department.findOne({ slug: ADMIN_SLUG });
    expect(devAdmin.departmentId.toString()).toBe(adminDept._id.toString());
  });
});
