#!/usr/bin/env node
/**
 * Agent 7 — CoreKnot Mongo Sunset E2E validation (local API).
 * Usage: node scripts/agent7-e2e-validation.mjs
 * Env: COREKNOT_API_URL (default http://localhost:5000)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = join(__dirname, '..');
const base = (process.env.COREKNOT_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/** @type {{ flow: string, status: 'PASS'|'FAIL'|'BLOCKED'|'SKIPPED', endpoint: string, httpStatus: number|null, notes: string }[]} */
const results = [];

function record(flow, status, endpoint, httpStatus, notes) {
  results.push({ flow, status, endpoint, httpStatus, notes });
}

async function fetchJson(path, opts = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    redirect: 'manual',
    ...opts,
    headers: {
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* plain text */
  }
  return { url, status: res.status, json, text: text.slice(0, 500), headers: res.headers };
}

function cookieFromSetCookie(setCookie) {
  if (!setCookie) return '';
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  // Prefer active session cookie (Max-Age > 0), not legacy clears (Max-Age=0).
  const active = parts.filter((c) => /Max-Age=[1-9]/i.test(c) && /coreknot_token/.test(c));
  const chosen = active.length ? active : parts.filter((c) => /coreknot_token_v3=eyJ/.test(c));
  return chosen.map((c) => c.split(';')[0]).join('; ');
}

async function main() {
  console.log(`\n=== Agent 7 E2E Validation ===\nBase: ${base}\n`);

  // ── Health (no auth) ──
  let serverUp = false;
  try {
    const health = await fetchJson('/api/health');
    serverUp = health.status === 200;
    record(
      'Health',
      serverUp ? 'PASS' : 'FAIL',
      'GET /api/health',
      health.status,
      health.json?.ok ? `status=${health.json.status || 'ok'}` : health.text.slice(0, 120),
    );

    const ready = await fetchJson('/api/health/ready');
    const readyOk = ready.status === 200 && ready.json?.ready !== false;
    record(
      'Health ready',
      readyOk ? 'PASS' : ready.status === 503 ? 'BLOCKED' : 'FAIL',
      'GET /api/health/ready',
      ready.status,
      ready.json?.dependencies
        ? Object.entries(ready.json.dependencies)
            .map(([k, v]) => `${k}:${v.ok ? 'ok' : 'fail'}`)
            .join(', ')
        : ready.text.slice(0, 120),
    );
  } catch (err) {
    record('Health', 'BLOCKED', 'GET /api/health', null, `Server unreachable: ${err.message}`);
    emitReport();
    process.exit(2);
  }

  // ── Unauthenticated probes ──
  const unauthPaths = [
    { flow: 'Login (unauth me)', endpoint: 'GET /api/auth/me', path: '/api/auth/me', expect: 401 },
    { flow: 'Workspace (unauth)', endpoint: 'GET /api/projects/workspaces', path: '/api/projects/workspaces', expect: 401 },
    { flow: 'Tasks (unauth)', endpoint: 'GET /api/tasks', path: '/api/tasks', expect: 401 },
    { flow: 'CRM (unauth)', endpoint: 'GET /api/crm/leads', path: '/api/crm/leads', expect: 401 },
    { flow: 'Dashboard (unauth)', endpoint: 'GET /api/dashboard/summary', path: '/api/dashboard/summary', expect: 401 },
    { flow: 'Mail (unauth)', endpoint: 'GET /api/campaigns', path: '/api/campaigns', expect: 401 },
    { flow: 'Calendar (unauth)', endpoint: 'GET /api/calendar', path: '/api/calendar', expect: 401 },
  ];

  for (const { flow, endpoint, path, expect } of unauthPaths) {
    const r = await fetchJson(path);
    const ok = r.status === expect;
    record(flow, ok ? 'PASS' : r.status >= 500 ? 'FAIL' : 'FAIL', endpoint, r.status, ok ? 'returns 401 as expected' : `expected ${expect}, got ${r.status}`);
  }

  // ── Dev bypass login ──
  let sessionCookie = '';
  const login = await fetchJson('/api/auth/dev-bypass', { method: 'POST' });
  if (login.status === 200) {
    sessionCookie = cookieFromSetCookie(login.headers.getSetCookie?.() || login.headers.get('set-cookie'));
    record('Login', 'PASS', 'POST /api/auth/dev-bypass', login.status, `user=${login.json?.user?.email || login.json?.email || 'ok'}`);
  } else if (login.status === 404) {
    record('Login', 'BLOCKED', 'POST /api/auth/dev-bypass', login.status, 'DEBUG_BYPASS not enabled');
  } else if (login.status === 503) {
    record('Login', 'BLOCKED', 'POST /api/auth/dev-bypass', login.status, login.json?.error || 'dev user not seeded');
  } else {
    record('Login', 'FAIL', 'POST /api/auth/dev-bypass', login.status, login.json?.error || login.text.slice(0, 120));
  }

  const auth = (path, opts = {}) =>
    fetchJson(path, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
    });

  if (!sessionCookie) {
    const authedFlows = ['Workspace load', 'Projects', 'Tasks', 'CRM', 'Dashboard', 'Mail', 'Calendar', 'Auth /me'];
    for (const flow of authedFlows) {
      record(flow, 'SKIPPED', '(auth required)', null, 'Login blocked or failed');
    }
    emitReport();
    process.exit(1);
  }

  // ── Auth /me ──
  const me = await auth('/api/auth/me');
  record(
    'Auth /me',
    me.status === 200 ? 'PASS' : 'FAIL',
    'GET /api/auth/me',
    me.status,
    me.status === 200 ? `email=${me.json?.email || me.json?.user?.email || 'ok'}` : me.json?.error || me.text.slice(0, 80),
  );

  // ── Workspace ──
  const workspaces = await auth('/api/projects/workspaces');
  const wsCount = Array.isArray(workspaces.json) ? workspaces.json.length : workspaces.json?.workspaces?.length;
  record(
    'Workspace load',
    workspaces.status === 200 ? 'PASS' : 'FAIL',
    'GET /api/projects/workspaces',
    workspaces.status,
    workspaces.status === 200 ? `count=${wsCount ?? '?'}` : workspaces.json?.error || workspaces.text.slice(0, 80),
  );

  // ── Projects ──
  const projects = await auth('/api/projects');
  const projCount = Array.isArray(projects.json) ? projects.json.length : projects.json?.projects?.length;
  record(
    'Projects',
    projects.status === 200 ? 'PASS' : 'FAIL',
    'GET /api/projects',
    projects.status,
    projects.status === 200 ? `count=${projCount ?? '?'}` : projects.json?.error || projects.text.slice(0, 80),
  );

  // ── Tasks ──
  const tasks = await auth('/api/tasks?limit=10');
  const taskCount = Array.isArray(tasks.json) ? tasks.json.length : tasks.json?.tasks?.length ?? tasks.json?.total;
  record(
    'Tasks',
    tasks.status === 200 ? 'PASS' : 'FAIL',
    'GET /api/tasks?limit=10',
    tasks.status,
    tasks.status === 200 ? `returned=${taskCount ?? '?'}` : tasks.json?.error || tasks.text.slice(0, 80),
  );

  // ── CRM ──
  const crm = await auth('/api/crm/leads?limit=5');
  const leadCount = Array.isArray(crm.json) ? crm.json.length : crm.json?.leads?.length ?? crm.json?.total;
  record(
    'CRM',
    crm.status === 200 ? 'PASS' : crm.status === 403 ? 'BLOCKED' : 'FAIL',
    'GET /api/crm/leads?limit=5',
    crm.status,
    crm.status === 200
      ? `leads=${leadCount ?? '?'}`
      : crm.status === 403
        ? 'CRM page access required for dev-bypass user'
        : crm.json?.error || crm.text.slice(0, 80),
  );

  const crmStats = await auth('/api/crm/stats');
  if (crm.status === 200) {
    record(
      'CRM stats',
      crmStats.status === 200 ? 'PASS' : 'FAIL',
      'GET /api/crm/stats',
      crmStats.status,
      crmStats.status === 200 ? 'stats loaded' : crmStats.json?.error || '',
    );
  }

  // ── Dashboard ──
  const dash = await auth('/api/dashboard/summary');
  record(
    'Dashboard',
    dash.status === 200 ? 'PASS' : 'FAIL',
    'GET /api/dashboard/summary',
    dash.status,
    dash.status === 200 ? 'summary loaded' : dash.json?.error || dash.text.slice(0, 80),
  );

  // ── Mail ──
  const mail = await auth('/api/campaigns');
  record(
    'Mail',
    mail.status === 200 ? 'PASS' : mail.status === 403 ? 'BLOCKED' : 'FAIL',
    'GET /api/campaigns',
    mail.status,
    mail.status === 200
      ? `campaigns=${Array.isArray(mail.json) ? mail.json.length : mail.json?.campaigns?.length ?? '?'}`
      : mail.json?.error || mail.text.slice(0, 80),
  );

  // ── Calendar ──
  const cal = await auth('/api/calendar');
  record(
    'Calendar',
    cal.status === 200 ? 'PASS' : 'FAIL',
    'GET /api/calendar',
    cal.status,
    cal.status === 200
      ? `events=${Array.isArray(cal.json) ? cal.json.length : cal.json?.events?.length ?? '?'}`
      : cal.json?.error || cal.text.slice(0, 80),
  );

  // ── DB boundary checks (Agent 6 audit areas) ──
  runBoundaryChecks();

  emitReport();
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const blocked = results.filter((r) => r.status === 'BLOCKED').length;
  process.exit(failed > 0 ? 1 : blocked > 0 ? 2 : 0);
}

function runBoundaryChecks() {
  const script = join(serverRoot, 'scripts', '_agent6-boundary-check.js');
  const r = spawnSync(process.execPath, [script], {
    cwd: serverRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 60_000,
  });
  if (r.status !== 0) {
    record('DB boundary audit', 'FAIL', 'node scripts/_agent6-boundary-check.js', null, r.stderr?.slice(0, 200) || 'script failed');
    return;
  }
  try {
    const stdout = r.stdout.trim();
    const jsonStart = stdout.indexOf('[');
    const rows = JSON.parse(stdout.slice(jsonStart, stdout.indexOf(']', jsonStart) + 1));
    const mismatchLine = stdout.includes('MISMATCH_SAMPLE');
    const mismatchSample = mismatchLine
      ? JSON.parse(stdout.split('MISMATCH_SAMPLE')[1].trim())
      : [];

    for (const row of rows) {
      const count = row.count ?? 0;
      const isFail = count > 0;
      record(
        `DB: ${row.check_name}`,
        isFail ? 'FAIL' : 'PASS',
        'SQL boundary check',
        null,
        `count=${count}`,
      );
    }

    record(
      'DB: Task/project workspace mismatch',
      mismatchSample.length > 0 ? 'FAIL' : 'PASS',
      'SQL boundary check',
      null,
      mismatchSample.length > 0
        ? `${mismatchSample.length}+ mismatches (sample in audit doc: 113 total)`
        : '0 mismatches in sample',
    );
  } catch (e) {
    record('DB boundary audit', 'FAIL', 'parse boundary output', null, e.message);
  }
}

function emitReport() {
  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, SKIPPED: 0 };
  for (const r of results) counts[r.status] += 1;
  const total = results.length;
  const passRate = total ? Math.round((counts.PASS / total) * 100) : 0;

  console.log('\n--- Results ---\n');
  for (const r of results) {
    console.log(
      `${r.status.padEnd(7)} ${r.flow.padEnd(28)} ${r.endpoint} ${r.httpStatus ?? '-'} ${r.notes}`,
    );
  }
  console.log(`\nPass rate: ${counts.PASS}/${total} (${passRate}%)`);
  console.log(`FAIL=${counts.FAIL} BLOCKED=${counts.BLOCKED} SKIPPED=${counts.SKIPPED}\n`);

  const outPath = join(serverRoot, 'docs', 'PRODUCTION_E2E_REPORT.json');
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), base, counts, passRate, results }, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
