jest.mock('../infrastructure/postgres/prismaClient', () => ({
  isPostgresAuthEnabled: jest.fn(),
  isPostgresTenantEnabled: jest.fn(),
  isPostgresLegacyAuthDataEnabled: jest.fn(),
  getPrismaClient: jest.fn(),
}));

const prismaClient = require('../infrastructure/postgres/prismaClient');
const {
  toAuthUserShape,
  toDepartmentShape,
  findStaffUserForLogin,
} = require('../repositories/staffUserRepository');

describe('staffUserRepository postgres shapes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps department row to mongoose-compatible shape', () => {
    const dept = toDepartmentShape({
      id: 'dept1',
      name: 'Admin',
      slug: 'admin',
      signupAllowed: false,
      permissionPreset: 'admin',
      pagePermissions: ['crm'],
    });
    expect(dept._id).toBe('dept1');
    expect(dept.slug).toBe('admin');
    expect(dept.pagePermissions).toEqual(['crm']);
  });

  it('maps staff user with password compare and department', async () => {
    const user = toAuthUserShape(
      {
        mongoId: 'user1',
        tenantId: 'tenant1',
        email: 'a@example.com',
        name: 'Alice',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuv', // invalid hash — compare returns false
        pagePermissions: [],
        metadata: {},
      },
      {
        id: 'dept1',
        name: 'Admin',
        slug: 'admin',
        signupAllowed: false,
        permissionPreset: 'admin',
        pagePermissions: [],
      },
    );

    expect(user._id).toBe('user1');
    expect(user.tenantId).toBe('tenant1');
    expect(user.departmentId.slug).toBe('admin');
    expect(typeof user.comparePassword).toBe('function');
    expect(typeof user.save).toBe('function');

    const plain = user.toObject();
    expect(plain.departmentId).toEqual(expect.objectContaining({ slug: 'admin', name: 'Admin' }));
  });

  it('findStaffUserForLogin resolves mongoId filter in postgres mode', async () => {
    prismaClient.isPostgresAuthEnabled.mockReturnValue(true);
    const findFirst = jest.fn().mockResolvedValue({
      mongoId: 'abc123',
      tenantId: 'tenant1',
      email: 'a@example.com',
      name: 'Alice',
      passwordHash: null,
      pagePermissions: [],
      metadata: {},
      department: null,
    });
    prismaClient.getPrismaClient.mockResolvedValue({
      ckLegacyStaffUser: { findFirst },
    });

    const user = await findStaffUserForLogin({ _id: 'abc123' });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mongoId: 'abc123' } }),
    );
    expect(user._id).toBe('abc123');
  });
});

describe('tenantRepository flags', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('enables tenant store only when flag and DATABASE_URL set', () => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tsc_community';
    process.env.COREKNOT_TENANT_STORE = 'postgres';
    delete process.env.COREKNOT_POSTGRES_ENABLED;
    const { isPostgresTenantEnabled } = require('../infrastructure/postgres/prismaClient');
    expect(isPostgresTenantEnabled()).toBe(true);
  });

  it('defaults tenant store to mongo when flag unset', () => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tsc_community';
    delete process.env.COREKNOT_TENANT_STORE;
    const { isPostgresTenantEnabled } = require('../infrastructure/postgres/prismaClient');
    expect(isPostgresTenantEnabled()).toBe(false);
  });
});

describe('tenantRepository shapes', () => {
  it('maps ck legacy tenant to mongoose-compatible shape', () => {
    const { toTenantShape } = require('../repositories/tenantRepository');
    const tenant = toTenantShape({
      id: '507f1f77bcf86cd799439011',
      name: 'Default Tenant',
      domain: 'example.com',
      contactEmail: 'admin@example.com',
      metadata: { tenantStatus: 'active' },
    });
    expect(tenant._id).toBe('507f1f77bcf86cd799439011');
    expect(tenant.status).toBe('active');
  });
});
