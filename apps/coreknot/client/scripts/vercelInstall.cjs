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

const standaloneInstall = () => {
  console.warn('[vercelInstall] standalone npm install in client');
  run('node scripts/generateVercelConfig.cjs', CLIENT_ROOT);
  run('npm install --no-workspaces', CLIENT_ROOT);
};

const monorepoInstall = () => {
  try {
    run('pnpm install --frozen-lockfile', REPO_ROOT);
    return;
  } catch (err) {
    console.warn('[vercelInstall] frozen lockfile install failed — retrying without frozen lockfile');
  }
  run('pnpm install --no-frozen-lockfile', REPO_ROOT);
};

if (process.env.VERCEL === '1') {
  standaloneInstall();
} else if (fs.existsSync(path.join(REPO_ROOT, 'pnpm-lock.yaml'))) {
  try {
    monorepoInstall();
  } catch (err) {
    console.warn('[vercelInstall] monorepo pnpm install failed — falling back to standalone npm');
    standaloneInstall();
  }
} else {
  standaloneInstall();
}
