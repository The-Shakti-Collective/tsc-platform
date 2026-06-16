#!/usr/bin/env node
/**
 * Run prisma generate with Windows-friendly retries when query_engine rename hits EPERM.
 */
import { copyFileSync, existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(pkgRoot, 'prisma', 'schema.prisma');
const clientDir = join(pkgRoot, 'node_modules', '.prisma', 'client');
const prismaCli = join(pkgRoot, 'node_modules', 'prisma', 'build', 'index.js');

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy wait — short backoff only
  }
}

function resolvePrismaCli() {
  if (existsSync(prismaCli)) {
    return { command: process.execPath, args: [prismaCli] };
  }
  return { command: 'pnpm', args: ['exec', 'prisma'] };
}

function healTmpEngineRename() {
  if (!existsSync(clientDir)) return false;
  const tmpFiles = readdirSync(clientDir).filter((name) =>
    name.startsWith('query_engine-windows.dll.node.tmp'),
  );
  if (tmpFiles.length === 0) return false;

  const target = join(clientDir, 'query_engine-windows.dll.node');
  for (const tmpName of tmpFiles) {
    const tmpPath = join(clientDir, tmpName);
    try {
      if (existsSync(target)) unlinkSync(target);
      copyFileSync(tmpPath, target);
      unlinkSync(tmpPath);
      console.warn(`[prisma-generate-safe] Healed EPERM rename via copy: ${tmpName}`);
      return true;
    } catch {
      // try next tmp file
    }
  }
  return false;
}

function isClientReady() {
  return existsSync(join(clientDir, 'default.js')) && existsSync(join(clientDir, 'index.js'));
}

function runGenerate() {
  const cli = resolvePrismaCli();
  const args = [...cli.args, 'generate', '--schema', schemaPath];
  const result = spawnSync(cli.command, args, {
    stdio: 'inherit',
    cwd: pkgRoot,
    shell: false,
    env: process.env,
  });
  return result.status ?? 1;
}

for (let attempt = 1; attempt <= 4; attempt += 1) {
  const code = runGenerate();
  if (code === 0) {
    process.exit(0);
  }

  const healed = healTmpEngineRename();
  if (healed && existsSync(join(clientDir, 'index.js'))) {
    console.warn('[prisma-generate-safe] Prisma client usable after heal — continuing build');
    process.exit(0);
  }

  if (attempt < 4) {
    console.warn(`[prisma-generate-safe] generate failed (attempt ${attempt}/4); retrying...`);
    try {
      rmSync(clientDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch {
      // best effort
    }
    sleep(400 * attempt);
  } else {
    process.exit(code);
  }
}
