/**
 * Shared env + CLI flags for CoreKnot ETL scripts.
 */
import {
  formatEnvHelp,
  loadMigrationEnv,
} from './load-migration-env.mjs';

loadMigrationEnv();

export const SOURCE_SYSTEM = 'coreknot';
export const MIGRATION_EVENT = 'migration_v1';

export function parseCliArgs(argv = process.argv.slice(2)) {
  const args = new Set(argv);
  return {
    dryRun: !args.has('--execute'),
    execute: args.has('--execute'),
    only: parseOnly(argv),
    batchSize: Number(process.env.MIGRATION_BATCH_SIZE || 100),
    verbose: args.has('--verbose'),
  };
}

function parseOnly(argv) {
  const flag = argv.find((a) => a.startsWith('--only='));
  if (!flag) return null;
  return flag
    .slice('--only='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env: ${name}. ${formatEnvHelp(name)}`);
  }
  return value;
}

/** Windows dev: prefer MONGODB_DIRECT_URI when SRV lookup fails. */
export function resolveMongoUri() {
  let uri = requireEnv('MONGODB_URI', process.env.MONGODB_URI_PROD);
  const direct = (process.env.MONGODB_DIRECT_URI || '').trim();
  if (uri.startsWith('mongodb+srv://') && direct) {
    uri = direct;
  }
  return uri;
}

export function getMongoConfig() {
  return {
    uri: resolveMongoUri(),
    dbName: process.env.MONGODB_DB || 'taskmaster_production',
  };
}

export function getPgConfig() {
  requireEnv('DATABASE_URL');
}

export function logStep(entity, message, stats = {}) {
  const suffix =
    Object.keys(stats).length > 0
      ? ` ${JSON.stringify(stats)}`
      : '';
  console.log(`[${entity}] ${message}${suffix}`);
}
