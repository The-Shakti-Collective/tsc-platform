#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIENT_ROOT = path.join(__dirname, '..');
const DIST = path.join(CLIENT_ROOT, 'dist');
const OUT = path.join(CLIENT_ROOT, '.vercel', 'output');
const STATIC = path.join(OUT, 'static');

const run = (cmd) => {
  console.log(`[vercelBuildOutput] ${cmd}`);
  execSync(cmd, {
    cwd: CLIENT_ROOT,
    stdio: 'inherit',
    env: { ...process.env, VERCEL: '1', COREKNOT_DEPLOY: 'true' },
  });
};

const copyDir = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
};

run('node scripts/vercelInstall.cjs');
run('node scripts/vercelBuild.cjs');

if (!fs.existsSync(DIST)) {
  console.error('[vercelBuildOutput] dist/ missing after build');
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(STATIC, { recursive: true });
copyDir(DIST, STATIC);

const proxyUrl = String(
  process.env.RENDER_API_PROXY_URL || process.env.VITE_API_URL || 'https://api.coreknot.in',
).replace(/\/$/, '');

const config = {
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: `${proxyUrl}/api/$1` },
    { src: '/socket.io/(.*)', dest: `${proxyUrl}/socket.io/$1` },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
};

fs.writeFileSync(path.join(OUT, 'config.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log('[vercelBuildOutput] wrote .vercel/output for prebuilt deploy');
