const {
  isPostgresTenantEnabled,
  isPostgresLegacyAuthDataEnabled,
  getPrismaClient,
} = require('../infrastructure/postgres/prismaClient');
const Tenant = require('../models/Tenant');
const { bypassOptions } = require('../infrastructure/database/bypassTenantPolicy');

const BYPASS = bypassOptions('tenantRepository');
const DEFAULT_TENANT_NAME = 'Default Tenant';

function toTenantShape(row) {
  if (!row) return null;
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const base = {
    _id: row.id ?? row._id,
    id: row.id ?? row._id,
    name: row.name,
    domain: row.domain ?? undefined,
    status: metadata.tenantStatus ?? row.status ?? 'trial',
    contactEmail: row.contactEmail ?? metadata.contactEmail ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    toObject() {
      return { ...this, _id: this._id };
    },
  };
  return base;
}

async function findPostgresTenant(where) {
  const prisma = await getPrismaClient();
  const row = await prisma.ckLegacyTenant.findFirst({ where });
  return toTenantShape(row);
}

async function resolveOrganizationId(legacyTenantId) {
  if (!legacyTenantId) return null;
  const prisma = await getPrismaClient();
  const mapping = await prisma.syncMapping.findUnique({
    where: {
      sourceSystem_externalId_tscEntityType: {
        sourceSystem: 'coreknot',
        externalId: String(legacyTenantId),
        tscEntityType: 'Organization',
      },
    },
  });
  return mapping?.tscEntityId ?? null;
}

async function findTenantById(tenantId) {
  if (tenantId == null) return null;
  if (isPostgresTenantEnabled()) {
    return findPostgresTenant({ id: String(tenantId) });
  }
  const { idFilter } = require('../utils/mongoId');
  return Tenant.findOne(idFilter(tenantId)).setOptions(BYPASS);
}

async function findTenantByName(name) {
  if (!name) return null;
  if (isPostgresTenantEnabled()) {
    return findPostgresTenant({ name });
  }
  return Tenant.findOne({ name }).setOptions(BYPASS);
}

async function findDefaultTenant() {
  if (isPostgresTenantEnabled()) {
    const prisma = await getPrismaClient();
    let row = await prisma.ckLegacyTenant.findFirst({
      where: { name: DEFAULT_TENANT_NAME },
    });
    if (!row) {
      row = await prisma.ckLegacyTenant.findFirst({ orderBy: { createdAt: 'asc' } });
    }
    return toTenantShape(row);
  }
  let tenant = await Tenant.findOne({ name: DEFAULT_TENANT_NAME }).setOptions(BYPASS);
  if (!tenant) {
    tenant = await Tenant.findOne({}).setOptions(BYPASS).sort({ createdAt: 1 });
  }
  return tenant;
}

async function ensureDefaultTenant() {
  const existing = await findDefaultTenant();
  if (existing) return existing;

  if (isPostgresTenantEnabled()) {
    const prisma = await getPrismaClient();
    const row = await prisma.ckLegacyTenant.create({
      data: {
        id: 'dev000000000000000000000001',
        name: DEFAULT_TENANT_NAME,
        contactEmail: 'admin@theshakticollective.in',
      },
    });
    return toTenantShape(row);
  }

  return Tenant.create({
    name: DEFAULT_TENANT_NAME,
    contactEmail: 'admin@theshakticollective.in',
  });
}

async function listTenantIds() {
  if (isPostgresTenantEnabled()) {
    const prisma = await getPrismaClient();
    const rows = await prisma.ckLegacyTenant.findMany({ select: { id: true } });
    return rows.map((r) => r.id);
  }
  const tenants = await Tenant.find({}).select('_id').setOptions(BYPASS).lean();
  return tenants.map((t) => t._id);
}

async function findOrganizationForTenant(legacyTenantId) {
  if (!isPostgresTenantEnabled() || !legacyTenantId) return null;
  const orgId = await resolveOrganizationId(legacyTenantId);
  if (!orgId) return null;
  const prisma = await getPrismaClient();
  return prisma.organization.findUnique({ where: { id: orgId } });
}

module.exports = {
  DEFAULT_TENANT_NAME,
  toTenantShape,
  findTenantById,
  findTenantByName,
  findDefaultTenant,
  ensureDefaultTenant,
  listTenantIds,
  resolveOrganizationId,
  findOrganizationForTenant,
  isPostgresTenantEnabled,
  isPostgresLegacyAuthDataEnabled,
};
