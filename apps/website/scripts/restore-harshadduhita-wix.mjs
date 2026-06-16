import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const srcDir =
  process.env.HARSHAD_WIX_SRC ||
  'C:/Users/ragha/Downloads/Harshaduhita_TSC_HTML/Harshad Duhita _ TSC_files';
const dstDir = resolve(root, 'public/harshadduhita');
const filesDir = resolve(dstDir, '_files');

mkdirSync(filesDir, { recursive: true });

copyFileSync(
  resolve(srcDir, 'Harshad Duhita _ TSC.html'),
  resolve(dstDir, 'index.html'),
);

for (const name of readdirSync(srcDir)) {
  if (/\.(js|jpg|jpeg|png)$/i.test(name)) {
    copyFileSync(resolve(srcDir, name), resolve(filesDir, name));
  }
}

const patch = spawnSync('node', ['scripts/patch-harshad-wix-html.mjs'], {
  cwd: root,
  stdio: 'inherit',
});

if (patch.status !== 0) process.exit(patch.status ?? 1);
console.log('restored harshadduhita Wix export to public/harshadduhita/');
