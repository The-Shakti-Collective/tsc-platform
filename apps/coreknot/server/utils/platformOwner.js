const User = require('../models/User');
const { getPlatformOwnerUserId } = require('../../shared/platformUserIds');
const { bypassOptions } = require('../infrastructure/database/bypassTenantPolicy');
const { isPostgresAuthEnabled } = require('../infrastructure/postgres/prismaClient');
const { canUseMongoModels } = require('../services/mongoConnectionService');
const {
  findStaffUserByEmail,
  loadAuthStaffUser,
} = require('../repositories/staffUserRepository');

const TENANT_SAFE_LOOKUP = bypassOptions('platform_owner_resolve');

/** Fallback emails when PLATFORM_OWNER_USER_ID / PlatformSettings is unset. */
const PLATFORM_OWNER_EMAIL_FALLBACKS = [
  process.env.PLATFORM_OWNER_EMAIL,
  process.env.ADMIN_EMAIL,
  'REDACTED_ADMIN@example.com',
].filter(Boolean);

function pickSelectedFields(user, select) {
  if (!user || !select) return user;
  const fields = String(select).split(/\s+/).filter(Boolean);
  if (!fields.length) return user;
  const picked = {};
  for (const field of fields) {
    if (user[field] !== undefined) picked[field] = user[field];
  }
  if (picked._id == null && user._id != null) picked._id = user._id;
  return picked;
}

async function refreshPlatformOwnerRuntime() {
  try {
    const { loadPlatformSettings } = require('../services/platformSettingsService');
    await loadPlatformSettings();
  } catch {
    /* settings optional during bootstrap */
  }
}

async function resolvePlatformOwnerFromPostgres({ select = '_id email name' } = {}) {
  const id = getPlatformOwnerUserId();
  if (id) {
    const user = await loadAuthStaffUser(id);
    if (user) return pickSelectedFields(user, select);
  }

  for (const email of PLATFORM_OWNER_EMAIL_FALLBACKS) {
    const user = await findStaffUserByEmail(email);
    if (user) return pickSelectedFields(user, select);
  }

  return null;
}

/**
 * Resolve platform owner user from PlatformSettings, env, then email fallbacks.
 * @returns {Promise<{ _id: import('mongoose').Types.ObjectId, email?: string, name?: string } | null>}
 */
async function resolvePlatformOwnerUser({ session, select = '_id email name' } = {}) {
  await refreshPlatformOwnerRuntime();

  if (isPostgresAuthEnabled() || !canUseMongoModels()) {
    return resolvePlatformOwnerFromPostgres({ select });
  }

  const id = getPlatformOwnerUserId();
  if (id) {
    let q = User.findById(id).select(select).setOptions(TENANT_SAFE_LOOKUP);
    if (session) q = q.session(session);
    const user = await q.lean();
    if (user) return user;
  }

  for (const email of PLATFORM_OWNER_EMAIL_FALLBACKS) {
    let q = User.findOne({ email }).select(select).setOptions(TENANT_SAFE_LOOKUP);
    if (session) q = q.session(session);
    const user = await q.lean();
    if (user) return user;
  }

  return null;
}

module.exports = {
  resolvePlatformOwnerUser,
  getPlatformOwnerUserId,
  PLATFORM_OWNER_EMAIL_FALLBACKS,
};
