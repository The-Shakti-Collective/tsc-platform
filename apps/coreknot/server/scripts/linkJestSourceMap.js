#!/usr/bin/env node
'use strict';

/**
 * pnpm isolates source-map-support deps; Jest 30 fails to resolve them on Windows.
 * Copy declared dependencies next to source-map-support after install.
 */
const fs = require('fs');
const path = require('path');

const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..', '..', '..');

function findSourceMapSupportDir() {
  const pnpmRoot = path.join(repoRoot, 'node_modules', '.pnpm');
  if (!fs.existsSync(pnpmRoot)) return null;

  const entries = fs.readdirSync(pnpmRoot).filter((name) => name.startsWith('source-map-support@'));
  for (const entry of entries) {
    const supportDir = path.join(pnpmRoot, entry, 'node_modules', 'source-map-support');
    if (fs.existsSync(supportDir)) return supportDir;
  }
  return null;
}

function resolvePackageDir(name) {
  try {
    return path.dirname(require.resolve(`${name}/package.json`, { paths: [serverRoot, repoRoot] }));
  } catch {
    return null;
  }
}

const supportDir = findSourceMapSupportDir();
if (!supportDir) {
  process.exit(0);
}

const pkgJson = JSON.parse(fs.readFileSync(path.join(supportDir, 'package.json'), 'utf8'));
const deps = Object.keys(pkgJson.dependencies || {});
const linkParent = path.join(supportDir, 'node_modules');
fs.mkdirSync(linkParent, { recursive: true });

for (const dep of deps) {
  const sourceDir = resolvePackageDir(dep);
  if (!sourceDir) continue;

  const target = path.join(linkParent, dep);
  if (fs.existsSync(target)) continue;

  try {
    fs.cpSync(sourceDir, target, { recursive: true, force: true });
    console.log(`[linkJestSourceMap] copied ${dep} for Jest`);
  } catch (err) {
    console.warn(`[linkJestSourceMap] skipped ${dep}:`, err.message);
  }
}
