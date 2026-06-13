#!/usr/bin/env node
/**
 * Create a self-contained pnpm deploy bundle for @tsc/api.
 * Cleans target dir, runs deploy, patches missing dist artifacts, verifies.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const deployDir = resolve(
  process.env.RAILWAY_DEPLOY_DIR ?? join(root, 'deploy'),
);
// pnpm deploy rejects some absolute Windows paths; run from monorepo root with a relative target.
const deployArg =
  process.env.RAILWAY_DEPLOY_DIR ??
  (process.platform === 'win32' ? './deploy' : deployDir);

const workspacePackages = [
  'analytics',
  'constants',
  'contracts',
  'database',
  'permissions',
  'projects',
  'tasks',
  'types',
  'workspace',
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: root,
    shell: process.platform === 'win32',
    ...options,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function removeDir(path) {
  if (!existsSync(path)) return;
  rmSync(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

function ensureApiDist() {
  const source = join(root, 'apps/api/dist');
  const target = join(deployDir, 'dist');
  if (existsSync(join(target, 'main.js'))) return;
  if (!existsSync(join(source, 'main.js'))) {
    console.error('[deploy:bundle] Missing apps/api/dist/main.js — run pnpm build first');
    process.exit(1);
  }
  console.warn('[deploy:bundle] Copying apps/api/dist into deploy bundle (pnpm deploy omitted dist)');
  cpSync(source, target, { recursive: true });
}

function ensureWorkspaceDist() {
  for (const pkg of workspacePackages) {
    const deployPkg = join(deployDir, 'node_modules/@tsc', pkg);
    const deployDist = join(deployPkg, 'dist/index.js');
    if (existsSync(deployDist)) continue;

    const sourceDist = join(root, 'packages', pkg, 'dist');
    if (!existsSync(join(sourceDist, 'index.js'))) {
      console.error(`[deploy:bundle] Missing packages/${pkg}/dist — run pnpm build first`);
      process.exit(1);
    }

    console.warn(`[deploy:bundle] Patching @tsc/${pkg}/dist into deploy bundle`);
    mkdirSync(deployPkg, { recursive: true });
    cpSync(sourceDist, join(deployPkg, 'dist'), { recursive: true });

    const sourcePkgJson = join(root, 'packages', pkg, 'package.json');
    if (existsSync(sourcePkgJson)) {
      cpSync(sourcePkgJson, join(deployPkg, 'package.json'));
    }
  }
}

console.log(`[deploy:bundle] Target: ${deployDir}`);
removeDir(deployDir);

run('pnpm', ['--filter', '@tsc/api', '--prod', 'deploy', deployArg]);

ensureApiDist();
ensureWorkspaceDist();

process.env.RAILWAY_DEPLOY_DIR = deployDir;
run('node', ['scripts/verify-deploy-bundle.mjs'], { cwd: root });

console.log('[deploy:bundle] OK');
