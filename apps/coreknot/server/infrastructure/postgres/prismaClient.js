/**
 * Lazy Prisma client for CoreKnot server (CommonJS).
 * Requires DATABASE_URL and `pnpm db:generate`.
 */

/** @type {import('@prisma/client').PrismaClient | null} */
let client = null;
/** @type {Promise<import('@prisma/client').PrismaClient> | null} */
let clientPromise = null;

const isPostgresConfigured = () => Boolean(
  process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim(),
);

const isPostgresStoreEnabled = (flagName) => (
  isPostgresConfigured()
  && process.env.COREKNOT_POSTGRES_ENABLED !== 'false'
  && process.env[flagName] === 'postgres'
);

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

/** When false, local dev may run without Mongo (postgres-only). Default: mongo required. */
const isMongoRequired = () => process.env.COREKNOT_MONGO_REQUIRED !== 'false';

/** Legacy ck_* tables — auth seed includes tenants/departments/users. */
const isPostgresLegacyAuthDataEnabled = () => (
  isPostgresAuthEnabled() || isPostgresTenantEnabled()
);

async function getPrismaClient() {
  if (client) return client;
  if (!clientPromise) {
    clientPromise = import('@tsc/database/client').then(({ PrismaClient }) => {
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
  isMongoRequired,
  isPostgresLegacyAuthDataEnabled,
  pingPostgres,
  disconnectPostgres,
};
