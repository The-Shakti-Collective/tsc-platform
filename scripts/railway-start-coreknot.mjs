#!/usr/bin/env node
/**
 * Railway entrypoint — CoreKnot Express API or worker (RUN_WORKERS=true).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function resolveDeployDir() {
  if (process.env.RAILWAY_DEPLOY_DIR) return process.env.RAILWAY_DEPLOY_DIR;
  if (existsSync('/app/deploy-coreknot')) return '/app/deploy-coreknot';
  const activePathFile = join(root, '.deploy-coreknot-active');
  if (existsSync(activePathFile)) {
    const active = readFileSync(activePathFile, 'utf8').trim();
    if (active && existsSync(join(active, 'server.js'))) return active;
  }
  return join(root, 'deploy-coreknot');
}

function prismaModuleRoots(baseDir) {
  const roots = [];
  const top = join(baseDir, 'node_modules');
  if (existsSync(join(top, '@prisma/client'))) roots.push(top);
  const pnpmDir = join(top, '.pnpm');
  if (existsSync(pnpmDir)) {
    for (const entry of readdirSync(pnpmDir)) {
      if (entry.startsWith('@prisma+client@')) {
        roots.push(join(pnpmDir, entry, 'node_modules'));
      }
    }
  }
  return roots;
}

const deployDir = resolveDeployDir();
const sharedDir = join(dirname(deployDir), 'shared');
const isWorker = process.env.RUN_WORKERS === 'true';
const entry = isWorker ? 'workers/startWorkers.js' : 'server.js';

const checks = [
  join(deployDir, entry),
  join(sharedDir, 'systemLogContract.js'),
  join(deployDir, 'node_modules/@tsc/database/dist/client.js'),
  join(deployDir, 'node_modules/.prisma/client/default.js'),
];

for (const modRoot of prismaModuleRoots(deployDir)) {
  checks.push(join(modRoot, '.prisma/client/default.js'));
}

for (const path of checks) {
  if (!existsSync(path)) {
    console.error(`FATAL: missing ${path}`);
    process.exit(1);
  }
}

console.log(`[railway-start-coreknot] ${isWorker ? 'Worker' : 'API'} from ${deployDir}`);

const child = spawn(process.execPath, [entry], {
  cwd: deployDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
