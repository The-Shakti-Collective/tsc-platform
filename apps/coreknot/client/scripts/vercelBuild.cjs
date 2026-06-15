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

if (fs.existsSync(path.join(REPO_ROOT, 'pnpm-lock.yaml'))) {
  run('pnpm exec turbo run build --filter=@tsc/coreknot-client', REPO_ROOT);
} else {
  console.warn('[vercelBuild] monorepo lockfile missing — standalone client build');
  run('npm run build', CLIENT_ROOT);
}
