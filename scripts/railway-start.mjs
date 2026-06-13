#!/usr/bin/env node
/**
 * Railway production entrypoint — runs API from pnpm deploy bundle.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const deployDir =
  process.env.RAILWAY_DEPLOY_DIR ??
  (existsSync('/app/deploy') ? '/app/deploy' : join(root, 'deploy'));

const checks = [
  join(deployDir, 'dist/main.js'),
  join(deployDir, 'node_modules/@tsc/database/dist/index.js'),
  join(deployDir, 'node_modules/@tsc/database/dist/client.js'),
  join(deployDir, 'node_modules/@tsc/constants/dist/index.js'),
  join(deployDir, 'node_modules/@tsc/types/dist/index.js'),
  join(deployDir, 'node_modules/@tsc/contracts/dist/index.js'),
];

for (const path of checks) {
  if (!existsSync(path)) {
    console.error(`FATAL: missing ${path}`);
    process.exit(1);
  }
}

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
