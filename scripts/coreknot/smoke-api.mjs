#!/usr/bin/env node
/**
 * CoreKnot API smoke — health + optional auth routes.
 * Usage:
 *   node scripts/coreknot/smoke-api.mjs
 *   COREKNOT_API_URL=https://api.coreknot.in node scripts/coreknot/smoke-api.mjs
 */
const base = (process.env.COREKNOT_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function get(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: 'manual' });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* plain text */
  }
  return { url, status: res.status, json, text: text.slice(0, 400) };
}

function isRailwayAppNotFound(r) {
  return (
    r.status === 404 &&
    (r.json?.message === 'Application not found' ||
      r.text.includes('Application not found'))
  );
}

function formatHealthDetail(r) {
  if (isRailwayAppNotFound(r)) {
    return 'Railway 404 — custom domain not attached to a live service (see FOUNDER-COREKNOT-LAUNCH.md §2)';
  }
  if (r.json?.dependencies) {
    const deps = Object.entries(r.json.dependencies)
      .map(([name, d]) => `${name}:${d.ok ? 'ok' : 'fail'}`)
      .join(', ');
    return `ready=${r.json.ready} deps=[${deps}]`;
  }
  return r.json ? JSON.stringify(r.json).slice(0, 160) : r.text;
}

async function main() {
  const checks = [
    { name: 'health', path: '/api/health', kind: 'health' },
    { name: 'health/ready', path: '/api/health/ready', kind: 'ready' },
    { name: 'tasks (auth)', path: '/api/tasks?limit=1', kind: 'auth' },
    { name: 'crm leads (auth)', path: '/api/crm/leads?limit=1', kind: 'auth' },
  ];

  console.log(`\n=== CoreKnot API smoke ===\nBase: ${base}\n`);

  let failed = 0;
  let blocked = false;

  for (const { name, path, kind } of checks) {
    try {
      const r = await get(path);
      blocked = blocked || isRailwayAppNotFound(r);

      const ok =
        kind === 'health' || kind === 'ready'
          ? r.status === 200 && r.json?.ready !== false && !isRailwayAppNotFound(r)
          : blocked
            ? false
            : r.status === 401 || r.status === 200;

      const mark = ok ? 'PASS' : 'FAIL';
      if (!ok) failed += 1;
      console.log(`${mark.padEnd(5)} ${name} → HTTP ${r.status} ${formatHealthDetail(r)}`);
    } catch (err) {
      failed += 1;
      console.log(`FAIL  ${name} → ${err.message}`);
    }
  }

  if (blocked) {
    console.log(
      '\nHint: attach api.coreknot.in to coreknot-api in Railway, redeploy, then re-run smoke.\n',
    );
  }

  console.log(failed ? `\nResult: FAIL (${failed} checks)\n` : '\nResult: PASS\n');
  process.exit(failed ? 1 : 0);
}

main();
