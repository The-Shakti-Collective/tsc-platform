#!/usr/bin/env node
/**
 * Railway production entrypoint — runs API from pnpm deploy bundle.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

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

const checks = [
  join(deployDir, 'dist/main.js'),
  join(deployDir, 'node_modules/@tsc/database/dist/index.js'),
  join(deployDir, 'node_modules/@tsc/database/dist/client.js'),
  join(deployDir, 'node_modules/@tsc/constants/dist/index.js'),
  join(deployDir, 'node_modules/@tsc/types/dist/index.js'),
  join(deployDir, 'node_modules/@tsc/contracts/dist/index.js'),
  join(deployDir, 'node_modules/.prisma/client/default.js'),
];

for (const path of checks) {
  if (!existsSync(path)) {
    console.error(`FATAL: missing ${path}`);
    process.exit(1);
  }
}

console.log(`[railway-start] Booting API from ${deployDir}`);

const child = spawn(process.execPath, ['dist/main.js'], {
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
