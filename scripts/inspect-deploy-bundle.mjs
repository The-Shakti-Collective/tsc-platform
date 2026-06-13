#!/usr/bin/env node
import { existsSync, lstatSync, readdirSync, readlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const deployDir = process.argv[2] ?? join(root, '.railway-deploy-test');
const tscDir = join(deployDir, 'node_modules/@tsc');

if (!existsSync(tscDir)) {
  console.error('missing', tscDir);
  process.exit(1);
}

for (const pkg of readdirSync(tscDir)) {
  const pkgPath = join(tscDir, pkg);
  const st = lstatSync(pkgPath);
  const kind = st.isSymbolicLink() ? `SYMLINK -> ${readlinkSync(pkgPath)}` : 'COPY';
  const dist = existsSync(join(pkgPath, 'dist/index.js'));
  console.log(`${pkg}: ${kind}, dist/index.js=${dist}`);
}
