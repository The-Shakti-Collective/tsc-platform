#!/usr/bin/env node
/**
 * Self-contained pnpm deploy bundle for @tsc/coreknot-server (Express + Prisma).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let deployDir = resolve(process.env.RAILWAY_DEPLOY_DIR ?? join(root, 'deploy-coreknot'));
let deployArg =
  process.env.RAILWAY_DEPLOY_DIR ??
  (process.platform === 'win32' ? './deploy-coreknot' : deployDir);

const workspacePackages = ['database'];

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
    if (code !== 'EPERM' && code !== 'EBUSY') throw err;
    const alternate = resolve(`${deployDir}.build.${Date.now()}`);
    console.warn(`[deploy:coreknot] ${deployDir} locked (${code}); using ${alternate}`);
    deployDir = alternate;
    return alternate;
  }
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
      if (entry.startsWith('@prisma+client@')) {
        roots.push(join(pnpmDir, entry, 'node_modules'));
      }
    }
  }
  const top = join(baseDir, 'node_modules');
  if (existsSync(join(top, '@prisma/client'))) roots.push(top);
  return roots;
}

function isGeneratedPrismaClient(clientDir) {
  const marker = join(clientDir, 'default.js');
  if (!existsSync(marker)) return false;
  return !readFileSync(marker, 'utf8').includes('did not initialize yet');
}

function syncPrismaClientToModuleRoots(sourceClientDir) {
  const source = resolve(sourceClientDir);
  for (const modRoot of prismaModuleRoots(deployDir)) {
    const target = join(modRoot, '.prisma/client');
    if (resolve(target) === source) continue;
    rmSync(target, { recursive: true, force: true });
    mkdirSync(join(modRoot, '.prisma'), { recursive: true });
    cpSync(source, target, { recursive: true });
  }
}

function ensurePrismaClient() {
  const prismaCli = resolvePrismaCli();
  const prismaDir = join(deployDir, 'prisma');
  mkdirSync(prismaDir, { recursive: true });

  let schema = readFileSync(join(root, 'packages/database/prisma/schema.prisma'), 'utf8');
  if (!/^\s*output\s*=/m.test(schema)) {
    schema = schema.replace(
      /generator client \{[^}]*\}/,
      'generator client {\n  provider = "prisma-client-js"\n  output   = "../node_modules/.prisma/client"\n}',
    );
  }
  writeFileSync(join(prismaDir, 'schema.prisma'), schema);

  console.log('[deploy:coreknot] Generating Prisma client in bundle');
  const generateArgs = [...prismaCli.args, 'generate', '--schema', join(deployDir, 'prisma/schema.prisma')];
  const result = spawnSync(prismaCli.command, generateArgs, {
    stdio: 'inherit',
    cwd: prismaCli.command === 'pnpm' ? root : deployDir,
    shell: false,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://tsc:tsc@localhost:5432/tsc_build',
    },
  });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

  if (!isGeneratedPrismaClient(join(deployDir, 'node_modules/.prisma/client'))) {
    console.error('[deploy:coreknot] Prisma client not initialized');
    process.exit(1);
  }
  syncPrismaClientToModuleRoots(join(deployDir, 'node_modules/.prisma/client'));
}

function ensureWorkspaceDist() {
  for (const pkg of workspacePackages) {
    const deployPkg = join(deployDir, 'node_modules/@tsc', pkg);
    const deployDist = join(deployPkg, 'dist/index.js');
    if (existsSync(deployDist)) continue;

    const sourceDist = join(root, 'packages', pkg, 'dist');
    if (!existsSync(join(sourceDist, 'index.js'))) {
      console.error(`[deploy:coreknot] Missing packages/${pkg}/dist — run pnpm --filter @tsc/database build`);
      process.exit(1);
    }
    console.warn(`[deploy:coreknot] Patching @tsc/${pkg}/dist`);
    mkdirSync(deployPkg, { recursive: true });
    cpSync(sourceDist, join(deployPkg, 'dist'), { recursive: true });
    cpSync(join(root, 'packages', pkg, 'package.json'), join(deployPkg, 'package.json'));
  }
}

function ensureCoreknotContracts() {
  const target = join(deployDir, 'node_modules/@coreknot/contracts');
  const source = join(root, 'apps/coreknot/shared/contracts');
  if (existsSync(join(target, 'index.js'))) return;
  console.warn('[deploy:coreknot] Patching @coreknot/contracts');
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true, filter: (src) => !src.endsWith('node_modules') });
  cpSync(join(source, 'package.json'), join(target, 'package.json'));
}

/** Runtime requires ../../shared from bundle subdirs → sibling of deploy dir (e.g. /app/shared). */
function ensureCoreknotShared() {
  const target = join(dirname(deployDir), 'shared');
  const source = join(root, 'apps/coreknot/shared');
  if (existsSync(join(target, 'systemLogContract.js'))) return;
  console.log(`[deploy:coreknot] Copying shared → ${target}`);
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true, filter: (src) => !src.endsWith('node_modules') });
  if (!existsSync(join(target, 'systemLogContract.js'))) {
    console.error('[deploy:coreknot] Missing shared/systemLogContract.js beside bundle');
    process.exit(1);
  }
}

deployDir = prepareDeployDir();
if (!process.env.RAILWAY_DEPLOY_DIR && process.platform === 'win32') {
  deployArg = `./${deployDir.split(/[/\\]/).pop()}`;
}

console.log(`[deploy:coreknot] Target: ${deployDir}`);
run('pnpm', ['--filter', '@tsc/coreknot-server', '--prod', 'deploy', deployArg]);

for (const file of ['server.js', 'workers/startWorkers.js']) {
  if (!existsSync(join(deployDir, file))) {
    console.error(`[deploy:coreknot] Missing ${file} in bundle`);
    process.exit(1);
  }
}

ensureWorkspaceDist();
ensureCoreknotContracts();
ensureCoreknotShared();
ensurePrismaClient();

process.env.RAILWAY_DEPLOY_DIR = deployDir;
run('node', ['scripts/verify-coreknot-deploy-bundle.mjs'], { cwd: root });
console.log('[deploy:coreknot] OK');
