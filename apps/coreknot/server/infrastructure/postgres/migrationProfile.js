/**
 * CoreKnot Mongo → Neon Postgres cutover profile.
 * Single source for production env validation and runtime gates.
 */

const {
  isPostgresConfigured,
  isPostgresAuthEnabled,
  isPostgresTenantEnabled,
  isPostgresProjectsEnabled,
  isPostgresTasksEnabled,
  isPostgresCrmEnabled,
  isPostgresArtistsEnabled,
  isMongoRequired,
} = require('./prismaClient');

/** Wave 1 P0 domains — must all be postgres before mongo sunset. */
const P0_STORE_FLAGS = [
  'COREKNOT_AUTH_STORE',
  'COREKNOT_TENANT_STORE',
  'COREKNOT_PROJECTS_STORE',
  'COREKNOT_TASKS_STORE',
  'COREKNOT_CRM_STORE',
  'COREKNOT_ARTISTS_STORE',
];

/** Wave 2 P1 domains — still default mongo; flip after controller wiring. */
const P1_STORE_FLAGS = [
  'COREKNOT_MAIL_STORE',
  'COREKNOT_DATAHUB_STORE',
  'COREKNOT_ATTENDANCE_STORE',
  'COREKNOT_FINANCE_STORE',
  'COREKNOT_NEWSLETTER_STORE',
  'COREKNOT_INTEGRATIONS_STORE',
  'COREKNOT_GAMIFICATION_STORE',
  'COREKNOT_CALENDAR_STORE',
  'COREKNOT_NOTIFICATIONS_STORE',
  'COREKNOT_CUSTOMIZATION_STORE',
];

const P0_FLAG_CHECKERS = [
  isPostgresAuthEnabled,
  isPostgresTenantEnabled,
  isPostgresProjectsEnabled,
  isPostgresTasksEnabled,
  isPostgresCrmEnabled,
  isPostgresArtistsEnabled,
];

/** Matches prismaClient default-store semantics for cutover validation. */
const POSTGRES_DEFAULT_STORE_FLAGS = new Set(['COREKNOT_CUSTOMIZATION_STORE']);

function isStoreFlagPostgres(flagName) {
  const value = process.env[flagName];
  if (value === 'postgres') return true;
  if (value === 'mongo') return false;
  return POSTGRES_DEFAULT_STORE_FLAGS.has(flagName);
}

function isPostgresMasterEnabled() {
  return isPostgresConfigured() && process.env.COREKNOT_POSTGRES_ENABLED !== 'false';
}

function areAllP0StoresOnPostgres() {
  return isPostgresMasterEnabled() && P0_FLAG_CHECKERS.every((fn) => fn());
}

function areAllP1StoresOnPostgres() {
  return isPostgresMasterEnabled() && P1_STORE_FLAGS.every((flag) => isStoreFlagPostgres(flag));
}

function isPostgresPrimaryCutover() {
  return (
    areAllP0StoresOnPostgres()
    && process.env.COREKNOT_POSTGRES_PRIMARY === 'true'
  );
}

function isFullPostgresCutover() {
  return (
    isPostgresPrimaryCutover()
    && areAllP1StoresOnPostgres()
    && !isMongoRequired()
  );
}

/** Production parallel-run: postgres reads/writes + mongo dual-write shadow. */
function isProductionParallelRun() {
  return (
    areAllP0StoresOnPostgres()
    && isMongoRequired()
    && process.env.NODE_ENV === 'production'
  );
}

/** Backups via Neon PITR — no Mongo GridFS / Supabase bucket. */
function useNeonBackupStrategy() {
  if (process.env.BACKUP_DESTINATION === 'neon') return true;
  if (process.env.BACKUP_DESTINATION === 'mongo' || process.env.BACKUP_DESTINATION === 'supabase') {
    return false;
  }
  return (
    process.env.COREKNOT_DISABLE_GRIDFS_BACKUP === 'true'
    && areAllP0StoresOnPostgres()
  );
}

function getMigrationProfile() {
  const p0 = P0_STORE_FLAGS.map((flag) => ({
    flag,
    store: isStoreFlagPostgres(flag) ? 'postgres' : 'mongo',
  }));
  const p1 = P1_STORE_FLAGS.map((flag) => ({
    flag,
    store: isStoreFlagPostgres(flag) ? 'postgres' : 'mongo',
  }));

  return {
    postgresConfigured: isPostgresConfigured(),
    postgresMasterEnabled: isPostgresMasterEnabled(),
    allP0OnPostgres: areAllP0StoresOnPostgres(),
    allP1OnPostgres: areAllP1StoresOnPostgres(),
    postgresPrimaryCutover: isPostgresPrimaryCutover(),
    fullPostgresCutover: isFullPostgresCutover(),
    mongoRequired: isMongoRequired(),
    productionParallelRun: isProductionParallelRun(),
    neonBackupStrategy: useNeonBackupStrategy(),
    p0Stores: p0,
    p1Stores: p1,
  };
}

function validateProductionCutover() {
  const issues = [];
  const profile = getMigrationProfile();

  if (!profile.postgresConfigured) {
    issues.push({ severity: 'error', code: 'NO_DATABASE_URL', message: 'DATABASE_URL (Neon) is required' });
  }
  if (!profile.postgresMasterEnabled) {
    issues.push({ severity: 'error', code: 'POSTGRES_DISABLED', message: 'Set COREKNOT_POSTGRES_ENABLED=true' });
  }
  if (!profile.allP0OnPostgres) {
    const pending = profile.p0Stores.filter((s) => s.store !== 'postgres').map((s) => s.flag);
    issues.push({
      severity: 'error',
      code: 'P0_FLAGS_INCOMPLETE',
      message: `Set all P0 store flags to postgres: ${pending.join(', ')}`,
    });
  }
  if (!profile.mongoRequired) {
    if (process.env.COREKNOT_POSTGRES_PRIMARY !== 'true') {
      issues.push({
        severity: 'error',
        code: 'POSTGRES_PRIMARY_REQUIRED',
        message: 'Set COREKNOT_POSTGRES_PRIMARY=true when COREKNOT_MONGO_REQUIRED=false',
      });
    }
    if (!profile.allP1OnPostgres) {
      const pending = profile.p1Stores.filter((s) => s.store !== 'postgres').map((s) => s.flag);
      issues.push({
        severity: 'error',
        code: 'P1_FLAGS_INCOMPLETE',
        message: `Set all P1 store flags to postgres: ${pending.join(', ')}`,
      });
    }
  }
  if (profile.mongoRequired && !process.env.MONGODB_URI_PROD && !process.env.MONGODB_URI) {
    issues.push({
      severity: 'warn',
      code: 'MONGO_URI_MISSING',
      message: 'MONGODB_URI_PROD recommended during parallel-run dual-write',
    });
  }
  if (!profile.neonBackupStrategy) {
    issues.push({
      severity: 'warn',
      code: 'LEGACY_BACKUP',
      message: 'Set COREKNOT_DISABLE_GRIDFS_BACKUP=true and BACKUP_DESTINATION=neon for Neon PITR',
    });
  }
  if (process.env.SUPABASE_SECONDARY_ENABLED === 'true') {
    issues.push({
      severity: 'warn',
      code: 'SUPABASE_ENABLED',
      message: 'Supabase secondary is deprecated — set SUPABASE_SECONDARY_ENABLED=false',
    });
  }

  return {
    ok: issues.every((i) => i.severity !== 'error'),
    profile,
    issues,
  };
}

/** Env block for Render/Railway (non-secret values). */
function getProductionEnvTemplate() {
  return {
    NODE_ENV: 'production',
    COREKNOT_POSTGRES_ENABLED: 'true',
    COREKNOT_POSTGRES_PRIMARY: 'true',
    COREKNOT_MONGO_REQUIRED: 'false',
    COREKNOT_AUTH_STORE: 'postgres',
    COREKNOT_TENANT_STORE: 'postgres',
    COREKNOT_PROJECTS_STORE: 'postgres',
    COREKNOT_TASKS_STORE: 'postgres',
    COREKNOT_CRM_STORE: 'postgres',
    COREKNOT_ARTISTS_STORE: 'postgres',
    COREKNOT_MAIL_STORE: 'postgres',
    COREKNOT_DATAHUB_STORE: 'postgres',
    COREKNOT_ATTENDANCE_STORE: 'postgres',
    COREKNOT_FINANCE_STORE: 'postgres',
    COREKNOT_NEWSLETTER_STORE: 'postgres',
    COREKNOT_INTEGRATIONS_STORE: 'postgres',
    COREKNOT_GAMIFICATION_STORE: 'postgres',
    COREKNOT_CALENDAR_STORE: 'postgres',
    COREKNOT_NOTIFICATIONS_STORE: 'postgres',
    COREKNOT_CUSTOMIZATION_STORE: 'postgres',
    COREKNOT_DISABLE_GRIDFS_BACKUP: 'true',
    BACKUP_DESTINATION: 'neon',
    SUPABASE_SECONDARY_ENABLED: 'false',
    LOGS_PRIMARY_SUPABASE: 'false',
    PERSIST_SYSTEM_LOGS: 'true',
    RUN_WORKERS: 'false',
  };
}

module.exports = {
  P0_STORE_FLAGS,
  P1_STORE_FLAGS,
  isStoreFlagPostgres,
  isPostgresMasterEnabled,
  areAllP0StoresOnPostgres,
  areAllP1StoresOnPostgres,
  isPostgresPrimaryCutover,
  isFullPostgresCutover,
  isProductionParallelRun,
  useNeonBackupStrategy,
  getMigrationProfile,
  validateProductionCutover,
  getProductionEnvTemplate,
};
