#!/usr/bin/env node
/**
 * Create a self-contained pnpm deploy bundle for @tsc/api.
 * Cleans target dir, runs deploy, patches missing dist artifacts, verifies.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let deployDir = resolve(
  process.env.RAILWAY_DEPLOY_DIR ?? join(root, 'deploy'),
);
// pnpm deploy rejects some absolute Windows paths; run from monorepo root with a relative target.
let deployArg =
  process.env.RAILWAY_DEPLOY_DIR ??
  (process.platform === 'win32' ? './deploy' : deployDir);

const PRISMA_CLIENT_MARKER = 'node_modules/.prisma/client/default.js';

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
  const stale = `${path}.old.${Date.now()}`;
  // Rename first so pnpm deploy gets a clean target even if stale delete is slow (Windows EPERM).
  renameSync(path, stale);
  rmSync(stale, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

function prepareDeployDir() {
  if (!existsSync(deployDir)) {
    mkdirSync(deployDir, { recursive: true });
    return deployDir;
  }

  try {
    removeDir(deployDir);
    return deployDir;
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined;
    if (code !== 'EPERM' && code !== 'EBUSY') {
      throw err;
    }

    const alternate = resolve(`${deployDir}.build.${Date.now()}`);
    console.warn(
      `[deploy:bundle] ${deployDir} is locked (${code}); using ${alternate}`,
    );
    return alternate;
  }
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

function resolvePrismaCli() {
  const jsCandidates = [
    join(root, 'packages/database/node_modules/prisma/build/index.js'),
    join(root, 'node_modules/prisma/build/index.js'),
  ];
  for (const candidate of jsCandidates) {
    if (existsSync(candidate)) {
      return { command: process.execPath, args: [candidate] };
    }
  }

  return { command: 'pnpm', args: ['exec', 'prisma'] };
}

function prismaModuleRoots(baseDir) {
  const roots = [];
  const pnpmDir = join(baseDir, 'node_modules/.pnpm');
  if (existsSync(pnpmDir)) {
    for (const entry of readdirSync(pnpmDir)) {
      if (!entry.startsWith('@prisma+client@')) continue;
      roots.push(join(pnpmDir, entry, 'node_modules'));
    }
  }

  return roots;
}

function isGeneratedPrismaClient(clientDir) {
  const marker = join(clientDir, 'default.js');
  if (!existsSync(marker)) return false;
  const content = readFileSync(marker, 'utf8');
  return !content.includes('did not initialize yet');
}

function syncPrismaClientToModuleRoots(sourceClientDir) {
  const source = resolve(sourceClientDir);
  for (const modRoot of prismaModuleRoots(deployDir)) {
    const target = join(modRoot, '.prisma/client');
    if (resolve(target) === source) continue;
    console.warn(`[deploy:bundle] Syncing .prisma/client into ${target}`);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(join(modRoot, '.prisma'), { recursive: true });
    cpSync(source, target, { recursive: true });
  }
}

function ensurePrismaClient() {
  const prismaCli = resolvePrismaCli();
  if (!prismaCli) {
    console.error('[deploy:bundle] Prisma CLI not found — run pnpm install && pnpm db:generate first');
    process.exit(1);
  }

  const prismaDir = join(deployDir, 'prisma');
  mkdirSync(prismaDir, { recursive: true });

  const srcSchema = join(root, 'packages/database/prisma/schema.prisma');
  let schema = readFileSync(srcSchema, 'utf8');
  if (!/^\s*output\s*=/m.test(schema)) {
    schema = schema.replace(
      /generator client \{[^}]*\}/,
      'generator client {\n  provider = "prisma-client-js"\n  output   = "../node_modules/.prisma/client"\n}',
    );
  }
  writeFileSync(join(prismaDir, 'schema.prisma'), schema);

  console.log('[deploy:bundle] Generating Prisma client in deploy bundle');
  const generateArgs = [
    ...prismaCli.args,
    'generate',
    '--schema',
    join(deployDir, 'prisma/schema.prisma'),
  ];
  const result = spawnSync(prismaCli.command, generateArgs, {
    stdio: 'inherit',
    cwd: prismaCli.command === 'pnpm' ? root : deployDir,
    shell: false,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://tsc:tsc@localhost:5432/tsc_build',
    },
  });
  if ((result.status ?? 1) !== 0) {
    console.error('[deploy:bundle] prisma generate failed');
    process.exit(result.status ?? 1);
  }

  if (!isGeneratedPrismaClient(join(deployDir, 'node_modules/.prisma/client'))) {
    console.error(`[deploy:bundle] Prisma generate did not create an initialized client at ${PRISMA_CLIENT_MARKER}`);
    process.exit(1);
  }

  syncPrismaClientToModuleRoots(join(deployDir, 'node_modules/.prisma/client'));

  for (const modRoot of prismaModuleRoots(deployDir)) {
    const clientDir = join(modRoot, '.prisma/client');
    if (!isGeneratedPrismaClient(clientDir)) {
      console.error(`[deploy:bundle] Prisma client missing or stubbed at ${clientDir}`);
      process.exit(1);
    }
  }
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

deployDir = prepareDeployDir();
if (!process.env.RAILWAY_DEPLOY_DIR && process.platform === 'win32') {
  deployArg = `./${deployDir.split(/[/\\]/).pop()}`;
} else if (process.env.RAILWAY_DEPLOY_DIR) {
  deployArg = process.env.RAILWAY_DEPLOY_DIR;
} else {
  deployArg = deployDir;
}

console.log(`[deploy:bundle] Target: ${deployDir}`);

run('pnpm', ['--filter', '@tsc/api', '--prod', 'deploy', deployArg]);

ensureApiDist();
ensureWorkspaceDist();
ensurePrismaClient();

process.env.RAILWAY_DEPLOY_DIR = deployDir;
run('node', ['scripts/verify-deploy-bundle.mjs'], { cwd: root });

console.log('[deploy:bundle] OK');
