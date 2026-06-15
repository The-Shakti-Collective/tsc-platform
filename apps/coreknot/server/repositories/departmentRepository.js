const {
  isPostgresLegacyAuthDataEnabled,
  getPrismaClient,
} = require('../infrastructure/postgres/prismaClient');
const Department = require('../models/Department');
const { toDepartmentShape } = require('./staffUserRepository');

const BYPASS = { bypassTenant: true };

const departmentSelect = {
  id: true,
  name: true,
  slug: true,
  signupAllowed: true,
  permissionPreset: true,
  pagePermissions: true,
  tenantId: true,
};

async function findPostgresDepartment(where) {
  const prisma = await getPrismaClient();
  const row = await prisma.ckLegacyDepartment.findFirst({
    where,
    select: departmentSelect,
  });
  return row ? toDepartmentShape(row) : null;
}

async function findDepartmentById(departmentId) {
  if (departmentId == null || departmentId === '') return null;
  if (isPostgresLegacyAuthDataEnabled()) {
    return findPostgresDepartment({ id: String(departmentId) });
  }
  return Department.findById(departmentId).setOptions(BYPASS);
}

async function findDepartmentBySlug(slug, { tenantId } = {}) {
  if (!slug) return null;
  if (isPostgresLegacyAuthDataEnabled()) {
    const where = { slug: String(slug).toLowerCase() };
    if (tenantId) where.tenantId = String(tenantId);
    return findPostgresDepartment(where);
  }
  const filter = { slug: String(slug).toLowerCase() };
  return Department.findOne(filter).setOptions(BYPASS);
}

async function findDepartments(filter = {}, options = {}) {
  if (isPostgresLegacyAuthDataEnabled()) {
    const prisma = await getPrismaClient();
    const where = { ...filter };
    if (options.tenantId) where.tenantId = String(options.tenantId);
    const rows = await prisma.ckLegacyDepartment.findMany({
      where,
      select: departmentSelect,
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toDepartmentShape);
  }
  let query = Department.find(filter);
  if (options.tenantId) {
    query = query.setOptions({ ...BYPASS, tenantId: options.tenantId });
  } else {
    query = query.setOptions(BYPASS);
  }
  return query;
}

module.exports = {
  findDepartmentById,
  findDepartmentBySlug,
  findDepartments,
};
