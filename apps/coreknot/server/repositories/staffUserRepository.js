const bcrypt = require('bcryptjs');
const { canUseMongoModels } = require('../services/mongoConnectionService');
const {
  isPostgresAuthEnabled,
  getPrismaClient,
  isPostgresConfigured,
  isMongoRequired,
} = require('../infrastructure/postgres/prismaClient');
const {
  createStaffUserFromMongo,
  updateStaffUserFromMongo,
  deleteStaffUserByMongoId,
  touchStaffUserLastOnline,
  findStaffUsersPostgres,
} = require('../infrastructure/postgres/postgresStaffUserWrites');
const User = require('../models/User');
const { idFilter } = require('../utils/mongoId');
const {
  shouldWritePostgresFirst,
  shouldMirrorMongo,
  asMongoDoc,
  newLegacyMongoId,
} = require('../infrastructure/postgres/writeStrategy');

const DEPARTMENT_POPULATE = 'name slug signupAllowed permissionPreset pagePermissions';
const BYPASS = { bypassTenant: true };

function preferPostgresAuth(options = {}) {
  if (options.bypass) return false;
  if (isPostgresAuthEnabled()) return true;
  if (!canUseMongoModels() && isPostgresConfigured()) return true;
  if (!isMongoRequired() && isPostgresConfigured()) return true;
  return false;
}

const departmentSelect = {
  id: true,
  name: true,
  slug: true,
  signupAllowed: true,
  permissionPreset: true,
  pagePermissions: true,
};

function toDepartmentShape(dept) {
  if (!dept) return undefined;
  return {
    _id: dept.id,
    id: dept.id,
    name: dept.name,
    slug: dept.slug,
    signupAllowed: dept.signupAllowed,
    permissionPreset: dept.permissionPreset,
    pagePermissions: dept.pagePermissions ?? [],
    toObject() {
      return { ...this, _id: this._id };
    },
  };
}

function readResetMeta(metadata) {
  const meta = metadata && typeof metadata === 'object' ? metadata : {};
  return {
    passwordResetToken: meta.passwordResetToken ?? undefined,
    passwordResetExpires: meta.passwordResetExpires
      ? new Date(meta.passwordResetExpires)
      : undefined,
    googleAccounts: meta.googleAccounts ?? [],
    googleAccessToken: meta.googleAccessToken ?? undefined,
    googleRefreshToken: meta.googleRefreshToken ?? undefined,
  };
}

function toAuthUserShape(row, department) {
  const dept = toDepartmentShape(department ?? row.department);
  const resetMeta = readResetMeta(row.metadata);
  const base = {
    _id: row.mongoId,
    id: row.mongoId,
    mongoId: row.mongoId,
    tenantId: row.tenantId,
    email: row.email,
    name: row.name,
    avatar: row.avatar ?? undefined,
    gender: row.gender ?? undefined,
    dateOfBirth: row.dateOfBirth ?? undefined,
    phone: row.phone ?? '',
    repId: row.repId ?? undefined,
    pagePermissions: row.pagePermissions ?? [],
    mustChangePassword: row.mustChangePassword ?? false,
    passwordChangedAt: row.passwordChangedAt ?? undefined,
    googleId: row.googleId ?? undefined,
    googleCalendarLinked: row.googleCalendarLinked ?? false,
    googleAccounts: resetMeta.googleAccounts ?? [],
    googleAccessToken: resetMeta.googleAccessToken,
    googleRefreshToken: resetMeta.googleRefreshToken,
    exp: row.exp ?? 0,
    level: row.level ?? 1,
    dailyStreak: row.dailyStreak ?? 0,
    departmentId: dept,
    password: row.passwordHash ?? undefined,
    passwordResetToken: resetMeta.passwordResetToken,
    passwordResetExpires: resetMeta.passwordResetExpires,
    comparePassword: async (candidate) => {
      if (!row.passwordHash) return false;
      if (/^\$2[aby]\$/.test(row.passwordHash)) {
        return bcrypt.compare(candidate, row.passwordHash);
      }
      return candidate === row.passwordHash;
    },
    save: async function save() {
      if (!isPostgresAuthEnabled()) return this;
      const prisma = await getPrismaClient();
      const data = {
        name: this.name,
        avatar: this.avatar ?? undefined,
        phone: this.phone ?? '',
        gender: this.gender ?? undefined,
        dateOfBirth: this.dateOfBirth ? new Date(this.dateOfBirth) : undefined,
        repId: this.repId ?? undefined,
        pagePermissions: this.pagePermissions ?? [],
        mustChangePassword: this.mustChangePassword,
        passwordChangedAt: this.passwordChangedAt,
        googleId: this.googleId ?? undefined,
        googleCalendarLinked: this.googleCalendarLinked ?? false,
        exp: this.exp ?? 0,
        level: this.level ?? 1,
        dailyStreak: this.dailyStreak ?? 0,
      };
      if (this.email) data.email = String(this.email).toLowerCase().trim();
      if (this.departmentId !== undefined) {
        const deptId = this.departmentId?._id?.toString?.()
          || this.departmentId?.toString?.()
          || this.departmentId
          || null;
        data.departmentId = deptId;
      }
      if (this.password) {
        data.passwordHash = /^\$2[aby]\$/.test(this.password)
          ? this.password
          : await bcrypt.hash(this.password, 10);
      }
      const resetMeta = {};
      if (this.passwordResetToken !== undefined) {
        resetMeta.passwordResetToken = this.passwordResetToken ?? null;
      }
      if (this.passwordResetExpires !== undefined) {
        resetMeta.passwordResetExpires = this.passwordResetExpires
          ? this.passwordResetExpires.toISOString()
          : null;
      }
      if (this.googleAccounts !== undefined) resetMeta.googleAccounts = this.googleAccounts;
      if (this.googleAccessToken !== undefined) resetMeta.googleAccessToken = this.googleAccessToken;
      if (this.googleRefreshToken !== undefined) resetMeta.googleRefreshToken = this.googleRefreshToken;
      const existing = await prisma.ckLegacyStaffUser.findUnique({
        where: { mongoId: row.mongoId },
        select: { metadata: true },
      });
      const baseMeta = existing?.metadata && typeof existing.metadata === 'object'
        ? existing.metadata
        : {};
      data.metadata = {
        ...baseMeta,
        ...resetMeta,
        teams: this.teams ?? baseMeta.teams ?? [],
        lastOnline: this.lastOnline ? new Date(this.lastOnline).toISOString() : baseMeta.lastOnline,
      };
      await prisma.ckLegacyStaffUser.update({
        where: { mongoId: row.mongoId },
        data,
      });
      row.mustChangePassword = this.mustChangePassword;
      row.passwordChangedAt = this.passwordChangedAt;
      if (this.password) row.passwordHash = data.passwordHash;
      return this;
    },
    toObject() {
      const obj = { ...this };
      delete obj.comparePassword;
      delete obj.save;
      delete obj.toObject;
      delete obj.password;
      // Keep populated department shape for API/client (matches Mongo populate toObject).
      if (dept) obj.departmentId = dept.toObject ? dept.toObject() : { ...dept };
      return obj;
    },
    select() { return this; },
    populate() { return Promise.resolve(this); },
  };
  return base;
}

async function findPostgresStaffUser(where, { withPassword = false } = {}) {
  const prisma = await getPrismaClient();
  const row = await prisma.ckLegacyStaffUser.findFirst({
    where,
    include: { department: { select: departmentSelect } },
  });
  if (!row) return null;
  const shaped = toAuthUserShape(row, row.department);
  if (!withPassword) delete shaped.password;
  return shaped;
}

function buildMongoLoginQuery(filter) {
  if (filter.email) {
    return User.findOne({ email: filter.email }).select('+password').setOptions(BYPASS);
  }
  if (filter.$or) {
    return User.findOne({ $or: filter.$or }).select('+password').setOptions(BYPASS);
  }
  if (filter._id || filter.id) {
    const id = filter._id || filter.id;
    return User.findOne(idFilter(id)).select('+password').setOptions(BYPASS);
  }
  return User.findOne(filter).select('+password').setOptions(BYPASS);
}

async function findStaffUserForLogin(filter) {
  if (preferPostgresAuth()) {
    if (filter.email) {
      return findPostgresStaffUser({ email: filter.email }, { withPassword: true });
    }
    if (filter._id || filter.id) {
      const id = String(filter._id || filter.id);
      return findPostgresStaffUser({ mongoId: id }, { withPassword: true });
    }
    if (filter.$or) {
      for (const clause of filter.$or) {
        if (clause.phone) {
          const byPhone = await findPostgresStaffUser({ phone: clause.phone }, { withPassword: true });
          if (byPhone) return byPhone;
        }
        if (clause.name) {
          const byName = await findPostgresStaffUser({ name: clause.name }, { withPassword: true });
          if (byName) return byName;
        }
      }
      return null;
    }
    return findPostgresStaffUser(filter, { withPassword: true });
  }
  return buildMongoLoginQuery(filter);
}

async function findStaffUserById(userId, options = {}) {
  const { withPassword = false, select } = options;

  if (preferPostgresAuth()) {
    const row = await findPostgresStaffUser(
      { mongoId: String(userId) },
      { withPassword },
    );
    return row;
  }

  let query = User.findOne(idFilter(userId)).setOptions(BYPASS);
  if (withPassword) query = query.select('+password');
  else if (select) query = query.select(select);
  else query = query.select('-password');
  return query;
}

async function loadAuthStaffUser(userId) {
  if (preferPostgresAuth()) {
    return findPostgresStaffUser({ mongoId: String(userId) });
  }
  return User.findOne(idFilter(userId))
    .setOptions(BYPASS)
    .populate('departmentId', DEPARTMENT_POPULATE);
}

async function findStaffUserByEmail(email, { withPassword = false } = {}) {
  const emailLower = String(email).toLowerCase().trim();
  if (preferPostgresAuth()) {
    return findPostgresStaffUser({ email: emailLower }, { withPassword });
  }
  let query = User.findOne({ email: emailLower }).setOptions(BYPASS);
  if (withPassword) query = query.select('+password');
  return query;
}

async function findStaffUserPopulated(userId) {
  if (preferPostgresAuth()) {
    return findPostgresStaffUser({ mongoId: String(userId) });
  }
  return User.findById(userId)
    .select('-password')
    .setOptions(BYPASS)
    .populate('departmentId', DEPARTMENT_POPULATE);
}

async function findStaffUserWithPassword(userId) {
  if (preferPostgresAuth()) {
    return findPostgresStaffUser({ mongoId: String(userId) }, { withPassword: true });
  }
  return User.findOne(idFilter(userId)).select('+password').setOptions(BYPASS);
}

async function findStaffUserByResetToken(hashedToken) {
  if (preferPostgresAuth()) {
    const prisma = await getPrismaClient();
    const rows = await prisma.ckLegacyStaffUser.findMany({
      include: { department: { select: departmentSelect } },
    });
    const now = new Date();
    for (const row of rows) {
      const reset = readResetMeta(row.metadata);
      if (
        reset.passwordResetToken === hashedToken
        && reset.passwordResetExpires
        && reset.passwordResetExpires > now
      ) {
        return toAuthUserShape(row, row.department);
      }
    }
    return null;
  }
  return User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  })
    .select('+password +passwordResetToken +passwordResetExpires')
    .setOptions(BYPASS);
}

async function findStaffUserByEmailForReset(email) {
  const emailLower = String(email).toLowerCase().trim();
  if (preferPostgresAuth()) {
    return findPostgresStaffUser({ email: emailLower }, { withPassword: true });
  }
  return User.findOne({ email: emailLower })
    .select('+passwordResetToken +passwordResetExpires')
    .setOptions(BYPASS);
}

async function createStaffUser(doc, options = {}) {
  if (shouldWritePostgresFirst(isPostgresAuthEnabled)) {
    const mongoDoc = shouldMirrorMongo()
      ? await User.create(doc)
      : asMongoDoc({ ...doc, _id: doc._id || newLegacyMongoId() });
    if (options.mirrorPostgres !== false) {
      await createStaffUserFromMongo(mongoDoc);
    }
    if (isPostgresAuthEnabled()) {
      return findPostgresStaffUser({ mongoId: String(mongoDoc._id) }, { withPassword: false });
    }
    return mongoDoc;
  }
  const user = await User.create(doc);
  if (options.mirrorPostgres !== false) {
    await createStaffUserFromMongo(user);
  }
  return user;
}

async function updateStaffUserMongo(mongoUser, options = {}) {
  if (mongoUser.mongoId && isPostgresAuthEnabled()) {
    await mongoUser.save();
    return mongoUser;
  }
  await mongoUser.save();
  if (options.mirrorPostgres !== false) {
    await updateStaffUserFromMongo(mongoUser);
  }
  return mongoUser;
}

async function deleteStaffUser(mongoId) {
  await User.findByIdAndDelete(mongoId);
  await deleteStaffUserByMongoId(mongoId);
}

module.exports = {
  DEPARTMENT_POPULATE,
  findStaffUserForLogin,
  findStaffUserById,
  loadAuthStaffUser,
  findStaffUserByEmail,
  findStaffUserPopulated,
  findStaffUserWithPassword,
  findStaffUserByResetToken,
  findStaffUserByEmailForReset,
  createStaffUser,
  updateStaffUserMongo,
  deleteStaffUser,
  touchStaffUserLastOnline,
  findStaffUsersPostgres,
  isPostgresAuthEnabled,
  toAuthUserShape,
  toDepartmentShape,
};
