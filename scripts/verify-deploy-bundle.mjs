#!/usr/bin/env node
/**
 * Fail Railway / CI if pnpm deploy bundle lacks runtime artifacts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function resolveDeployDir() {
  if (process.env.RAILWAY_DEPLOY_DIR) {
    return process.env.RAILWAY_DEPLOY_DIR;
  }
  if (existsSync('/app/deploy')) {
    return '/app/deploy';
  }

  const activePathFile = join(root, '.deploy-active');
  if (existsSync(activePathFile)) {
    const active = readFileSync(activePathFile, 'utf8').trim();
    if (active && existsSync(join(active, 'dist/main.js'))) {
      return active;
    }
  }

  return join(root, 'deploy');
}

const deployDir = resolveDeployDir();

const required = [
  'dist/main.js',
  'node_modules/@tsc/database/dist/index.js',
  'node_modules/@tsc/database/dist/client.js',
  'node_modules/@tsc/constants/dist/index.js',
  'node_modules/@tsc/types/dist/index.js',
  'node_modules/@tsc/contracts/dist/index.js',
  'node_modules/@tsc/permissions/dist/index.js',
  'node_modules/@tsc/analytics/dist/index.js',
  'node_modules/@tsc/workspace/dist/index.js',
  'node_modules/@tsc/projects/dist/index.js',
  'node_modules/@tsc/tasks/dist/index.js',
  'node_modules/.prisma/client/default.js',
];

const missing = required.filter((rel) => !existsSync(join(deployDir, rel)));

if (missing.length > 0) {
  console.error(`[verify:deploy] Missing artifacts in ${deployDir}:`);
  for (const path of missing) {
    console.error(`  - ${path}`);
  }
  process.exit(1);
}

const prismaSmoke = spawnSync(
  process.execPath,
  [
    '-e',
    "const { PrismaClient } = require('@tsc/database/client'); new PrismaClient();",
  ],
  {
    cwd: deployDir,
    stdio: 'pipe',
  },
);

if ((prismaSmoke.status ?? 1) !== 0) {
  const detail = prismaSmoke.stderr?.toString().trim() || prismaSmoke.stdout?.toString().trim();
  console.error('[verify:deploy] @prisma/client smoke test failed');
  if (detail) console.error(detail);
  process.exit(1);
}

console.log(`[verify:deploy] OK — ${required.length} artifacts in ${deployDir}`);
