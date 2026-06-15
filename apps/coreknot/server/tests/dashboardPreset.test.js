const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const DashboardPreset = require('../models/DashboardPreset');
const Department = require('../models/Department');
const { DEV_DEFAULT_PASSWORD } = require('../../shared/defaultPassword');
const { PRESET_PAGES } = require('../utils/pagePermissions');
const { VALID_DASHBOARD_COMPONENT_IDS } = require('../utils/dashboardComponents');

const TEST_EMAIL = `dashboard-preset-${Date.now()}@coreknot-test.local`;

async function loginAsAdmin(agent) {
  let adminDept = await Department.findOne({ slug: 'admin' });
  if (!adminDept) {
    adminDept = await Department.create({
      name: 'Admin',
      slug: 'admin',
      permissionPreset: 'admin',
      pagePermissions: PRESET_PAGES.admin,
    });
  }

  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Dashboard Admin',
      email: TEST_EMAIL,
      password: DEV_DEFAULT_PASSWORD,
      gender: 'male',
    });
  expect(reg.statusCode).toBe(201);
  await User.findByIdAndUpdate(reg.body._id, { departmentId: adminDept._id });

  const login = await agent.post('/api/auth/login').send({
    email: TEST_EMAIL,
    password: DEV_DEFAULT_PASSWORD,
  });
  expect(login.statusCode).toBe(200);
  return reg.body._id;
}

describe('Dashboard preset API', () => {
  let agent;
  let userId;

  beforeEach(async () => {
    agent = request.agent(app);
    userId = await loginAsAdmin(agent);
    await DashboardPreset.deleteMany({ userId });
  });

  it('includes observability-links in server validation list', () => {
    expect(VALID_DASHBOARD_COMPONENT_IDS).toContain('observability-links');
  });

  it('POST /api/customization/dashboard/preset saves observability-links widget', async () => {
    const elements = [
      { componentId: 'leaderboard', size: '1', col: 1, row: 1, order: 1, visible: true },
      { componentId: 'observability-links', size: '2', col: 1, row: 2, order: 2, visible: true },
      { componentId: 'system-health', size: '1', col: 3, row: 2, order: 3, visible: true },
    ];

    const res = await agent.post('/api/customization/dashboard/preset').send({
      layoutName: 'Admin Ops',
      name: 'Admin Ops',
      department: 'custom',
      elements,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.elements.some((el) => el.componentId === 'observability-links')).toBe(true);

    const stored = await DashboardPreset.findOne({ userId });
    expect(stored).toBeTruthy();
    expect(stored.elements.some((el) => el.componentId === 'observability-links')).toBe(true);
    expect(stored.presets.some((p) => p.name === 'Admin Ops')).toBe(true);
  });

  it('rejects unknown component ids with 400', async () => {
    const res = await agent.post('/api/customization/dashboard/preset').send({
      layoutName: 'Bad',
      elements: [{ componentId: 'not-a-widget', size: '1', col: 1, row: 1, order: 1, visible: true }],
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid component/i);
  });
});
