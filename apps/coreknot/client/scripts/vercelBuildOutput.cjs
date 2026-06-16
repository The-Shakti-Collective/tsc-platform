#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIENT_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(CLIENT_ROOT, '..', '..', '..');
const DIST = path.join(CLIENT_ROOT, 'dist');

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

const proxyUrl = String(
  process.env.RENDER_API_PROXY_URL || process.env.VITE_API_URL || 'https://api.coreknot.in',
).replace(/\/$/, '');

const buildConfig = () => ({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: `${proxyUrl}/api/$1` },
    { src: '/socket.io/(.*)', dest: `${proxyUrl}/socket.io/$1` },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
});

const writeBuildOutput = (outDir) => {
  const staticDir = path.join(outDir, 'static');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(staticDir, { recursive: true });
  copyDir(DIST, staticDir);
  fs.writeFileSync(
    path.join(outDir, 'config.json'),
    `${JSON.stringify(buildConfig(), null, 2)}\n`,
    'utf8',
  );
};

run('node scripts/vercelInstall.cjs');
run('node scripts/vercelBuild.cjs');

if (!fs.existsSync(DIST)) {
  console.error('[vercelBuildOutput] dist/ missing after build');
  process.exit(1);
}

const clientOut = path.join(CLIENT_ROOT, '.vercel', 'output');
writeBuildOutput(clientOut);
console.log('[vercelBuildOutput] wrote client .vercel/output');

if (process.env.VERCEL === '1') {
  const monorepoPkg = path.join(REPO_ROOT, 'package.json');
  if (fs.existsSync(monorepoPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(monorepoPkg, 'utf8'));
      if (pkg.workspaces || pkg.name === 'tsc-platform') {
        const monorepoOut = path.join(REPO_ROOT, '.vercel', 'output');
        writeBuildOutput(monorepoOut);
        console.log('[vercelBuildOutput] mirrored .vercel/output to monorepo root');
      }
    } catch (err) {
      console.warn('[vercelBuildOutput] skip monorepo mirror:', err.message);
    }
  }
}

console.log('[vercelBuildOutput] ready for Build Output API deploy');
