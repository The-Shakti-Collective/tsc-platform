#!/usr/bin/env node
/**
 * Validate CoreKnot production Postgres cutover env + optional live checks.
 *
 * Usage:
 *   node scripts/migrations/coreknot/verify-cutover.mjs
 *   node scripts/migrations/coreknot/verify-cutover.mjs --ping
 */
import { createRequire } from 'node:module';
import { config as loadDotenv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

loadDotenv({ path: resolve(root, '.env') });
loadDotenv({ path: resolve(root, 'apps/coreknot/server/.env') });

const require = createRequire(import.meta.url);
const {
  validateProductionCutover,
} = require('../../../apps/coreknot/server/infrastructure/postgres/migrationProfile.js');

const ping = process.argv.includes('--ping');

async function pingPostgres() {
  const { pingPostgres: pingFn } = require('../../../apps/coreknot/server/infrastructure/postgres/prismaClient.js');
  return pingFn();
}

function printReport(result) {
  const { ok, profile, issues } = result;
  console.log('\n=== CoreKnot Postgres cutover validation ===\n');
  console.log('Profile:', JSON.stringify(profile, null, 2));
  if (issues.length) {
    console.log('\nIssues:');
    for (const issue of issues) {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}`);
    }
  } else {
    console.log('\nNo issues.');
  }
  console.log(`\nResult: ${ok ? 'PASS' : 'FAIL'}\n`);
}

async function main() {
  const result = validateProductionCutover();

  if (ping) {
    const pg = await pingPostgres();
    if (!pg.ok) {
      result.issues.push({
        severity: 'error',
        code: 'POSTGRES_PING_FAILED',
        message: pg.reason || 'Postgres ping failed',
      });
      result.ok = false;
    } else {
      console.log('Postgres ping: OK');
    }
  }

  printReport(result);
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
