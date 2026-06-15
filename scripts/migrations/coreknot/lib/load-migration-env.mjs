/**
 * Load migration env from CoreKnot server `.env` and monorepo root `.env`.
 *
 * Precedence (lowest → highest):
 *   1. `apps/coreknot/server/.env` — fills unset keys (Mongo, JWT, etc.)
 *   2. repo root `.env` — fills unset keys (typically DATABASE_URL)
 *   3. repo root `.env` — always wins for DATABASE_URL
 *   4. `apps/coreknot/server/.env` — always wins for MONGODB_* keys
 *   5. Shell exports — always win (never overwritten here)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../../..');

export const SERVER_ENV_PATH = join(REPO_ROOT, 'apps/coreknot/server/.env');
export const ROOT_ENV_PATH = join(REPO_ROOT, '.env');

/** Root `.env` wins for Postgres / Prisma. */
const ROOT_OVERRIDE_KEYS = new Set(['DATABASE_URL', 'DIRECT_URL']);

/** Server `.env` wins for legacy Mongo ETL source. */
const SERVER_OVERRIDE_KEYS = new Set([
  'MONGODB_URI',
  'MONGODB_DIRECT_URI',
  'MONGODB_DB',
  'MONGODB_URI_PROD',
]);

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function applyEnvFile(filePath, { onlyUnset = true, keys = null } = {}) {
  if (!existsSync(filePath)) return;
  const parsed = parseEnvFile(readFileSync(filePath, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (keys && !keys.has(key)) continue;
    if (onlyUnset && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

/** @type {string[]} */
let loadedEnvPaths = [];

/** @returns {string[]} paths loaded (existing files only) */
export function loadMigrationEnv() {
  loadedEnvPaths = [];
  if (existsSync(SERVER_ENV_PATH)) {
    applyEnvFile(SERVER_ENV_PATH, { onlyUnset: true });
    loadedEnvPaths.push(SERVER_ENV_PATH);
  }
  if (existsSync(ROOT_ENV_PATH)) {
    applyEnvFile(ROOT_ENV_PATH, { onlyUnset: true });
    loadedEnvPaths.push(ROOT_ENV_PATH);
    applyEnvFile(ROOT_ENV_PATH, {
      onlyUnset: false,
      keys: ROOT_OVERRIDE_KEYS,
    });
  }
  if (existsSync(SERVER_ENV_PATH)) {
    applyEnvFile(SERVER_ENV_PATH, {
      onlyUnset: false,
      keys: SERVER_OVERRIDE_KEYS,
    });
  }
  return loadedEnvPaths;
}

export function getLoadedEnvPaths() {
  return [...loadedEnvPaths];
}

export function formatEnvHelp(missingVar) {
  const loaded = getLoadedEnvPaths();
  const loadedNote =
    loaded.length > 0
      ? `Loaded: ${loaded.join(', ')}`
      : `No env files found at ${ROOT_ENV_PATH} or ${SERVER_ENV_PATH}`;

  const hints = {
    MONGODB_URI:
      'Set MONGODB_URI (or MONGODB_URI_PROD) in apps/coreknot/server/.env — Windows: prefer directConnection shard URI over mongodb+srv',
    MONGODB_URI_PROD:
      'Set MONGODB_URI_PROD in apps/coreknot/server/.env (used when MONGODB_URI is unset)',
    DATABASE_URL:
      'Set DATABASE_URL in repo root .env (Neon) or apps/coreknot/server/.env',
  };

  const hint = hints[missingVar] ?? 'Set in shell or the env files above';
  return `${loadedNote}. ${hint}`;
}