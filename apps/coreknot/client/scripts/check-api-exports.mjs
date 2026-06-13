import fs from 'fs';
import path from 'path';

const srcRoot = path.join(process.cwd(), 'src');
const files = [];

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p);
    else if (/\.(jsx?|tsx?)$/.test(e.name)) files.push(p);
  }
}
walk(srcRoot);

const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]*lib\/(\w+Api)['"])/g;
const libExports = new Map();

for (const f of fs.readdirSync(path.join(srcRoot, 'lib')).filter((x) => x.endsWith('Api.js'))) {
  const text = fs.readFileSync(path.join(srcRoot, 'lib', f), 'utf8');
  const names = new Set();
  let m;
  const re1 = /export\s+(?:async\s+)?function\s+(\w+)/g;
  while ((m = re1.exec(text))) names.add(m[1]);
  const re2 = /export\s+const\s+(\w+)/g;
  while ((m = re2.exec(text))) names.add(m[1]);
  const re3 = /export\s*\{([^}]+)\}/g;
  while ((m = re3.exec(text))) {
    m[1].split(',').forEach((p) => {
      const n = p.trim().split(/\s+as\s+/);
      names.add(n[n.length - 1].trim());
    });
  }
  libExports.set(f.replace('.js', ''), names);
}

const missing = new Map();
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(text))) {
    const specs = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    const lib = m[3];
    const exports = libExports.get(lib) || new Set();
    for (const spec of specs) {
      const parts = spec.split(/\s+as\s+/);
      const imported = parts[0].trim();
      if (imported && !exports.has(imported)) {
        if (!missing.has(lib)) missing.set(lib, new Set());
        missing.get(lib).add(imported);
      }
    }
  }
}

for (const [lib, set] of [...missing.entries()].sort()) {
  console.log(`\n${lib}:`);
  for (const x of [...set].sort()) console.log(`  ${x}`);
}
