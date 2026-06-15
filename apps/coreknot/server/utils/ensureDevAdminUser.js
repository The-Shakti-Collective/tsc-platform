/**

 * Ensure known dev login accounts exist with the default seed password.

 * Skipped in production and when SKIP_DEV_ADMIN_BOOTSTRAP=true.

 * ADMIN_EMAIL is intentionally excluded — it is the platform owner contact, not a synthetic dev account.

 * Use DEV_BOOTSTRAP_EMAILS to opt specific addresses into seed sync; dev bypass uses DEV_BYPASS_EMAIL.

 */

const logger = require('./logger');

const { getDefaultSeedPassword } = require('./defaultPassword');

const { normalizePersonName } = require('./sanitizer');

const Department = require('../models/Department');

const { seedDepartments } = require('../services/departmentService');

const { ADMIN_SLUG, isAdminUser } = require('./departmentPermissions');



const DEFAULT_DEV_ACCOUNTS = [

  { email: 'dev-admin@example.com', name: 'Dev Admin' },

  { email: 'dev-owner@example.com', name: 'Dev Admin' },

];

/** Email used by POST /api/auth/dev-bypass and DEBUG_BYPASS middleware — not ADMIN_EMAIL. */
const DEV_BYPASS_DEFAULT_EMAIL = 'dev-admin@example.com';

function resolveDevBypassEmail() {
  return (process.env.DEV_BYPASS_EMAIL || DEV_BYPASS_DEFAULT_EMAIL).trim().toLowerCase();
}

function resolveDevAccounts() {
  const extraRaw = (process.env.DEV_BOOTSTRAP_EMAILS || '').trim();

  const extras = extraRaw

    ? extraRaw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

    : [];

  const byEmail = new Map(DEFAULT_DEV_ACCOUNTS.map((a) => [a.email, a]));

  for (const email of extras) {

    if (!byEmail.has(email)) {

      byEmail.set(email, { email, name: 'Dev User' });

    }

  }

  return [...byEmail.values()];
}

async function ensurePostgresDevAdminUser() {
  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');
  const { getPrismaClient, isPostgresAuthEnabled } = require('../infrastructure/postgres/prismaClient');
  if (!isPostgresAuthEnabled()) return;

  const prisma = await getPrismaClient();
  const seedPassword = getDefaultSeedPassword();
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  const accounts = resolveDevAccounts();

  let tenant = await prisma.ckLegacyTenant.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!tenant) {
    tenant = await prisma.ckLegacyTenant.create({
      data: {
        id: 'dev000000000000000000000001',
        name: 'Dev Tenant',
        domain: 'dev.local',
      },
    });
  }

  let adminDept = await prisma.ckLegacyDepartment.findFirst({
    where: { tenantId: tenant.id, slug: ADMIN_SLUG },
  });
  if (!adminDept) {
    adminDept = await prisma.ckLegacyDepartment.create({
      data: {
        id: 'dev000000000000000000000002',
        tenantId: tenant.id,
        name: 'Admin',
        slug: ADMIN_SLUG,
        permissionPreset: 'admin',
        pagePermissions: [],
      },
    });
  }

  for (const account of accounts) {
    const email = account.email.trim().toLowerCase();
    const { name } = normalizePersonName(account.name);
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.ckLegacyStaffUser.findUnique({ where: { email } });

    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.ckLegacyStaffUser.create({
        data: {
          mongoId: crypto.randomBytes(12).toString('hex'),
          tenantId: tenant.id,
          departmentId: adminDept.id,
          email,
          name: name || account.name,
          passwordHash,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      });
      logger.info('authBootstrap', 'Created postgres dev login account', { email });
      // eslint-disable-next-line no-continue
      continue;
    }

    const matchesSeed = existing.passwordHash
      && await bcrypt.compare(seedPassword, existing.passwordHash);
    const updates = {};
    if (!matchesSeed) {
      updates.passwordHash = passwordHash;
      updates.mustChangePassword = false;
      updates.passwordChangedAt = new Date();
      logger.info('authBootstrap', 'Synced postgres dev account password to default seed', { email });
    }
    if (existing.departmentId !== adminDept.id) {
      updates.departmentId = adminDept.id;
      logger.info('authBootstrap', 'Assigned admin department to postgres dev account', { email });
    }
    if (Object.keys(updates).length) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.ckLegacyStaffUser.update({ where: { email }, data: updates });
    }
  }
}

async function ensureDevAdminUser() {

  if (process.env.NODE_ENV === 'production') return;

  if (process.env.SKIP_DEV_ADMIN_BOOTSTRAP === 'true') return;

  const { isPostgresAuthEnabled } = require('../infrastructure/postgres/prismaClient');
  if (isPostgresAuthEnabled()) {
    return ensurePostgresDevAdminUser();
  }
  const User = require('../models/User');

  const { getRandomAvatar } = require('./avatarGenerator');

  const seedPassword = getDefaultSeedPassword();

  const accounts = resolveDevAccounts();



  await seedDepartments();

  const adminDept = await Department.findOne({ slug: ADMIN_SLUG });

  if (!adminDept) {

    logger.warn('authBootstrap', 'Admin department missing — skip dev admin assignment');

    return;

  }



  for (const account of accounts) {

    const email = account.email.trim().toLowerCase();

    // eslint-disable-next-line no-await-in-loop

    let user = await User.findOne({ email }).select('+password').setOptions({ bypassTenant: true });



    if (!user) {

      const { name } = normalizePersonName(account.name);

      // eslint-disable-next-line no-await-in-loop

      user = await User.create({

        name,

        email,

        password: seedPassword,

        gender: 'male',

        avatar: getRandomAvatar('male'),

        passwordChangedAt: new Date(),

        mustChangePassword: false,

        departmentId: adminDept._id,

      });

      logger.info('authBootstrap', 'Created dev login account with admin department', { email });

    } else if (!user.password) {

      user.password = seedPassword;

      user.mustChangePassword = false;

      user.passwordChangedAt = new Date();

      // eslint-disable-next-line no-await-in-loop

      await user.save();

      logger.info('authBootstrap', 'Set password on OAuth-only dev account', { email });

    } else {

      // eslint-disable-next-line no-await-in-loop

      const matchesSeed = await user.comparePassword(seedPassword);

      if (!matchesSeed) {

        user.password = seedPassword;

        user.mustChangePassword = false;

        user.passwordChangedAt = new Date();

        // eslint-disable-next-line no-await-in-loop

        await user.save();

        logger.info('authBootstrap', 'Synced dev account password to default seed', { email });

      }

    }



    if (user.departmentId?.toString() !== adminDept._id.toString()) {

      user.departmentId = adminDept._id;

      // eslint-disable-next-line no-await-in-loop

      await user.save();

      logger.info('authBootstrap', 'Assigned admin department to dev account', { email });

    }

  }

}



module.exports = {
  ensureDevAdminUser,
  resolveDevAccounts,
  resolveDevBypassEmail,
  DEV_BYPASS_DEFAULT_EMAIL,
};



if (require.main === module) {

  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

  const mongoose = require('mongoose');

  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri) {

    console.error('MONGODB_URI not set in server/.env');

    process.exit(1);

  }

  if (!uri.includes('taskmaster_local')) {

    console.error('Refusing to run: MONGODB_URI must target taskmaster_local');

    process.exit(1);

  }



  mongoose.connect(uri)

    .then(() => ensureDevAdminUser())

    .then(() => mongoose.disconnect())

    .catch((err) => {

      console.error(err);

      process.exit(1);

    });

}


