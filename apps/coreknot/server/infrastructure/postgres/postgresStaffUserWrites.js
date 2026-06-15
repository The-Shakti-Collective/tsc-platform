const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getPrismaClient, isPostgresAuthEnabled } = require('./prismaClient');
const { upsertSyncMapping } = require('./dualWriteHelper');
const { resolveTscId } = require('./syncMappingHelper');

function readResetMeta(metadata) {
  const meta = metadata && typeof metadata === 'object' ? metadata : {};
  return {
    passwordResetToken: meta.passwordResetToken ?? null,
    passwordResetExpires: meta.passwordResetExpires ?? null,
    teams: meta.teams ?? [],
    googleAccounts: meta.googleAccounts ?? [],
    lastOnline: meta.lastOnline ?? null,
  };
}

function buildStaffUserData(mongoDoc, { passwordHash } = {}) {
  const meta = readResetMeta({});
  const deptId = mongoDoc.departmentId?._id?.toString?.()
    || mongoDoc.departmentId?.toString?.()
    || mongoDoc.departmentId
    || null;
  const tenantId = mongoDoc.tenantId?.toString?.() || mongoDoc.tenantId || null;

  const data = {
    mongoId: mongoDoc._id.toString(),
    tenantId,
    departmentId: deptId || undefined,
    email: String(mongoDoc.email).toLowerCase().trim(),
    name: mongoDoc.name,
    avatar: mongoDoc.avatar ?? undefined,
    gender: mongoDoc.gender ?? undefined,
    dateOfBirth: mongoDoc.dateOfBirth ? new Date(mongoDoc.dateOfBirth) : undefined,
    phone: mongoDoc.phone ?? '',
    repId: mongoDoc.repId ?? undefined,
    pagePermissions: mongoDoc.pagePermissions ?? [],
    mustChangePassword: mongoDoc.mustChangePassword ?? false,
    passwordChangedAt: mongoDoc.passwordChangedAt ?? undefined,
    googleId: mongoDoc.googleId ?? undefined,
    googleCalendarLinked: mongoDoc.googleCalendarLinked ?? false,
    exp: mongoDoc.exp ?? 0,
    level: mongoDoc.level ?? 1,
    dailyStreak: mongoDoc.dailyStreak ?? 0,
    metadata: {
      ...meta,
      teams: mongoDoc.teams ?? [],
      lastOnline: mongoDoc.lastOnline ? new Date(mongoDoc.lastOnline).toISOString() : null,
    },
  };

  if (passwordHash) data.passwordHash = passwordHash;
  else if (mongoDoc.password && /^\$2[aby]\$/.test(mongoDoc.password)) {
    data.passwordHash = mongoDoc.password;
  }

  return data;
}

async function hashPasswordIfNeeded(raw) {
  if (!raw) return undefined;
  if (/^\$2[aby]\$/.test(raw)) return raw;
  return bcrypt.hash(raw, 10);
}

async function createStaffUserFromMongo(mongoDoc) {
  if (!isPostgresAuthEnabled()) return null;
  const prisma = await getPrismaClient();
  const passwordHash = await hashPasswordIfNeeded(mongoDoc.password);
  const data = buildStaffUserData(mongoDoc, { passwordHash });

  let tenant = data.tenantId
    ? await prisma.ckLegacyTenant.findUnique({ where: { id: data.tenantId } })
    : null;
  if (!tenant) {
    tenant = await prisma.ckLegacyTenant.findFirst({ orderBy: { createdAt: 'asc' } });
    if (tenant) data.tenantId = tenant.id;
  }
  if (!data.tenantId) return null;

  const existing = await prisma.ckLegacyStaffUser.findUnique({
    where: { mongoId: data.mongoId },
  });
  if (existing) return existing;

  const row = await prisma.ckLegacyStaffUser.create({ data });
  await upsertSyncMapping(data.mongoId, 'Person', data.mongoId, { legacy: 'ck_staff_user' });
  return row;
}

async function updateStaffUserFromMongo(mongoDoc) {
  if (!isPostgresAuthEnabled()) return null;
  const prisma = await getPrismaClient();
  const mongoId = mongoDoc._id.toString();
  const existing = await prisma.ckLegacyStaffUser.findUnique({ where: { mongoId } });
  if (!existing) return createStaffUserFromMongo(mongoDoc);

  const passwordHash = mongoDoc.password
    ? await hashPasswordIfNeeded(mongoDoc.password)
    : undefined;
  const data = buildStaffUserData(mongoDoc, passwordHash ? { passwordHash } : {});
  delete data.mongoId;
  delete data.tenantId;

  const prevMeta = readResetMeta(existing.metadata);
  data.metadata = {
    ...prevMeta,
    teams: mongoDoc.teams ?? prevMeta.teams,
    lastOnline: mongoDoc.lastOnline ? new Date(mongoDoc.lastOnline).toISOString() : prevMeta.lastOnline,
  };

  return prisma.ckLegacyStaffUser.update({
    where: { mongoId },
    data,
  });
}

async function deleteStaffUserByMongoId(mongoId) {
  if (!isPostgresAuthEnabled()) return;
  const prisma = await getPrismaClient();
  await prisma.ckLegacyStaffUser.deleteMany({ where: { mongoId: String(mongoId) } });
}

async function touchStaffUserLastOnline(mongoUserId) {
  if (!isPostgresAuthEnabled()) return;
  const prisma = await getPrismaClient();
  const row = await prisma.ckLegacyStaffUser.findUnique({
    where: { mongoId: String(mongoUserId) },
    select: { metadata: true },
  });
  if (!row) return;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  await prisma.ckLegacyStaffUser.update({
    where: { mongoId: String(mongoUserId) },
    data: {
      metadata: {
        ...meta,
        lastOnline: new Date().toISOString(),
      },
    },
  });
}

async function findStaffUsersPostgres({ skip = 0, limit = 50, departmentId } = {}) {
  if (!isPostgresAuthEnabled()) return null;
  const prisma = await getPrismaClient();
  const where = {};
  if (departmentId) where.departmentId = String(departmentId);

  const [rows, total] = await Promise.all([
    prisma.ckLegacyStaffUser.findMany({
      where,
      include: { department: true },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.ckLegacyStaffUser.count({ where }),
  ]);

  return { rows, total };
}

module.exports = {
  createStaffUserFromMongo,
  updateStaffUserFromMongo,
  deleteStaffUserByMongoId,
  touchStaffUserLastOnline,
  findStaffUsersPostgres,
  buildStaffUserData,
};
