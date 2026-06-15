#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIENT_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.resolve(CLIENT_ROOT, '../../..');

const run = (cmd, cwd) => {
  console.log(`[vercelInstall] ${cmd} (cwd=${cwd})`);
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, HUSKY: '0' },
  });
};

if (fs.existsSync(path.join(REPO_ROOT, 'pnpm-lock.yaml'))) {
  run('pnpm install --frozen-lockfile', REPO_ROOT);
} else {
  console.warn('[vercelInstall] monorepo lockfile missing — standalone npm install in client');
  run('node scripts/generateVercelConfig.cjs', CLIENT_ROOT);
  run('npm install', CLIENT_ROOT);
}
