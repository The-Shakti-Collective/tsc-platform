#!/usr/bin/env node
/**
 * Fail CI / Railway build if workspace packages the API depends on lack dist artifacts.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'packages/database/dist/index.js',
  'packages/database/dist/client.js',
  'packages/constants/dist/index.js',
  'packages/types/dist/index.js',
  'packages/contracts/dist/index.js',
  'packages/permissions/dist/index.js',
  'packages/analytics/dist/index.js',
  'packages/workspace/dist/index.js',
  'packages/projects/dist/index.js',
  'packages/tasks/dist/index.js',
  'apps/api/dist/main.js',
];

const missing = required.filter((rel) => !existsSync(join(root, rel)));

if (missing.length > 0) {
  console.error('[verify:dist] Missing build artifacts:');
  for (const path of missing) {
    console.error(`  - ${path}`);
  }
  process.exit(1);
}

console.log(`[verify:dist] OK — ${required.length} artifacts present`);
