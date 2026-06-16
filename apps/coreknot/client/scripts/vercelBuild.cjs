#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIENT_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.resolve(CLIENT_ROOT, '../../..');

const run = (cmd, cwd) => {
  console.log(`[vercelBuild] ${cmd} (cwd=${cwd})`);
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, HUSKY: '0' },
  });
};

const standaloneBuild = () => {
  console.warn('[vercelBuild] standalone client build');
  run('npm run build --no-workspaces', CLIENT_ROOT);
};

if (process.env.VERCEL === '1') {
  // install already ran in vercelInstall.cjs (combined buildCommand on Vercel)
  standaloneBuild();
} else if (fs.existsSync(path.join(REPO_ROOT, 'pnpm-lock.yaml'))) {
  try {
    run('pnpm exec turbo run build --filter=@tsc/coreknot-client', REPO_ROOT);
  } catch (err) {
    console.warn('[vercelBuild] turbo build failed — falling back to standalone client build');
    standaloneBuild();
  }
} else {
  standaloneBuild();
}
