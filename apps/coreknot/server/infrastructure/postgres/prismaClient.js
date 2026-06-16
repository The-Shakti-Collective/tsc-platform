/**
 * Lazy Prisma client for CoreKnot server (CommonJS).
 * Requires DATABASE_URL and `pnpm db:generate`.
 */

const { createRequire } = require('module');

/** Resolve @prisma/client via @tsc/database so pnpm links the generated client. */
const requirePrismaClient = createRequire(require.resolve('@tsc/database/client'));

/** @type {import('@prisma/client').PrismaClient | null} */
let client = null;
/** @type {Promise<import('@prisma/client').PrismaClient> | null} */
let clientPromise = null;

const isPostgresConfigured = () => Boolean(
  process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim(),
);

/** Store flags that default to postgres when unset (Wave 2 cutover complete). */
const POSTGRES_DEFAULT_STORE_FLAGS = new Set(['COREKNOT_CUSTOMIZATION_STORE']);

const isPostgresStoreEnabled = (flagName) => {
  if (!isPostgresConfigured() || process.env.COREKNOT_POSTGRES_ENABLED === 'false') {
    return false;
  }
  const value = process.env[flagName];
  if (value === 'postgres') return true;
  if (value === 'mongo') return false;
  return POSTGRES_DEFAULT_STORE_FLAGS.has(flagName);
};

const isPostgresAuthEnabled = () => isPostgresStoreEnabled('COREKNOT_AUTH_STORE');

const isPostgresTenantEnabled = () => isPostgresStoreEnabled('COREKNOT_TENANT_STORE');

const isPostgresArtistsEnabled = () => isPostgresStoreEnabled('COREKNOT_ARTISTS_STORE');

const isPostgresProjectsEnabled = () => isPostgresStoreEnabled('COREKNOT_PROJECTS_STORE');

const isPostgresTasksEnabled = () => isPostgresStoreEnabled('COREKNOT_TASKS_STORE');

const isPostgresCrmEnabled = () => isPostgresStoreEnabled('COREKNOT_CRM_STORE');

const isPostgresMailEnabled = () => isPostgresStoreEnabled('COREKNOT_MAIL_STORE');

const isPostgresDataHubEnabled = () => isPostgresStoreEnabled('COREKNOT_DATAHUB_STORE');

const isPostgresAttendanceEnabled = () => isPostgresStoreEnabled('COREKNOT_ATTENDANCE_STORE');

const isPostgresFinanceEnabled = () => isPostgresStoreEnabled('COREKNOT_FINANCE_STORE');

const isPostgresNewsletterEnabled = () => isPostgresStoreEnabled('COREKNOT_NEWSLETTER_STORE');

const isPostgresIntegrationsEnabled = () => isPostgresStoreEnabled('COREKNOT_INTEGRATIONS_STORE');

const isPostgresGamificationEnabled = () => isPostgresStoreEnabled('COREKNOT_GAMIFICATION_STORE');

const isPostgresCalendarEnabled = () => isPostgresStoreEnabled('COREKNOT_CALENDAR_STORE');

const isPostgresNotificationsEnabled = () => isPostgresStoreEnabled('COREKNOT_NOTIFICATIONS_STORE');

const isPostgresCustomizationEnabled = () => isPostgresStoreEnabled('COREKNOT_CUSTOMIZATION_STORE');

/** When false, local dev may run without Mongo (postgres-only). Default: mongo required. */
const isMongoRequired = () => process.env.COREKNOT_MONGO_REQUIRED !== 'false';

/** Legacy ck_* tables — auth seed includes tenants/departments/users. */
const isPostgresLegacyAuthDataEnabled = () => (
  isPostgresAuthEnabled() || isPostgresTenantEnabled()
);

async function getPrismaClient() {
  if (client) return client;
  if (!clientPromise) {
    clientPromise = Promise.resolve().then(() => {
      const { PrismaClient } = requirePrismaClient('@prisma/client');
      client = new PrismaClient();
      return client;
    });
  }
  return clientPromise;
}

async function pingPostgres() {
  if (!isPostgresConfigured()) {
    return { ok: false, reason: 'DATABASE_URL not set' };
  }
  try {
    const prisma = await getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function disconnectPostgres() {
  if (client) {
    await client.$disconnect();
    client = null;
    clientPromise = null;
  }
}

module.exports = {
  getPrismaClient,
  isPostgresConfigured,
  isPostgresStoreEnabled,
  isPostgresAuthEnabled,
  isPostgresTenantEnabled,
  isPostgresArtistsEnabled,
  isPostgresProjectsEnabled,
  isPostgresTasksEnabled,
  isPostgresCrmEnabled,
  isPostgresMailEnabled,
  isPostgresDataHubEnabled,
  isPostgresAttendanceEnabled,
  isPostgresFinanceEnabled,
  isPostgresNewsletterEnabled,
  isPostgresIntegrationsEnabled,
  isPostgresGamificationEnabled,
  isPostgresCalendarEnabled,
  isPostgresNotificationsEnabled,
  isPostgresCustomizationEnabled,
  isMongoRequired,
  isPostgresLegacyAuthDataEnabled,
  pingPostgres,
  disconnectPostgres,
};
