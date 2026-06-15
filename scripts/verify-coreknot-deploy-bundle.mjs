#!/usr/bin/env node
/**
 * Verify CoreKnot pnpm deploy bundle has runtime artifacts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function resolveDeployDir() {
  if (process.env.RAILWAY_DEPLOY_DIR) return process.env.RAILWAY_DEPLOY_DIR;
  if (existsSync('/app/deploy-coreknot')) return '/app/deploy-coreknot';
  return join(root, 'deploy-coreknot');
}

const deployDir = resolveDeployDir();
const sharedSibling = join(dirname(deployDir), 'shared', 'systemLogContract.js');

const required = [
  'server.js',
  'workers/startWorkers.js',
  'node_modules/@tsc/database/dist/client.js',
  'node_modules/@coreknot/contracts/index.js',
  'node_modules/.prisma/client/default.js',
];

let failed = 0;
for (const rel of required) {
  const path = join(deployDir, rel);
  if (!existsSync(path)) {
    console.error(`[verify:coreknot] MISSING ${rel}`);
    failed += 1;
    continue;
  }
  if (rel.endsWith('default.js')) {
    const content = readFileSync(path, 'utf8');
    if (content.includes('did not initialize yet')) {
      console.error(`[verify:coreknot] Prisma stub at ${rel}`);
      failed += 1;
    }
  }
}

if (!existsSync(sharedSibling)) {
  console.error('[verify:coreknot] MISSING sibling shared/systemLogContract.js (../../shared from bundle)');
  failed += 1;
}

if (failed) {
  console.error(`[verify:coreknot] FAIL (${failed} missing)`);
  process.exit(1);
}
console.log(`[verify:coreknot] OK — ${deployDir}`);
