#!/usr/bin/env node
/**
 * Run turbo tasks; on Windows native crash (0xC0000135 / exit 3221225781),
 * fall back to pnpm recursive filters so local dev works without turbo.
 */
import { spawnSync } from 'node:child_process';

const TURBO_CRASH_EXITS = new Set([3221225781, -1073741515]);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/turbo-or-fallback.mjs run <task> [turbo flags...]');
  process.exit(1);
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

function parseFilter(turboArgs) {
  for (const arg of turboArgs) {
    if (arg.startsWith('--filter=')) {
      return arg.slice('--filter='.length);
    }
  }
  const filterIdx = turboArgs.indexOf('--filter');
  if (filterIdx >= 0 && turboArgs[filterIdx + 1]) {
    return turboArgs[filterIdx + 1];
  }
  return null;
}

function parseFilters(turboArgs) {
  const filters = [];
  for (let i = 0; i < turboArgs.length; i += 1) {
    if (turboArgs[i] === '--filter' && turboArgs[i + 1]) {
      filters.push(turboArgs[i + 1]);
      i += 1;
    }
  }
  return filters;
}

function runPnpmTask(task, filter) {
  return run('pnpm', [`--filter=${filter}`, 'run', task]);
}

function runFallback(turboArgs) {
  const subcommand = turboArgs[0];
  if (subcommand !== 'run') {
    console.error('[turbo-or-fallback] Fallback supports only "turbo run <tasks...>".');
    return 1;
  }

  const tasks = turboArgs.slice(1).filter((arg) => !arg.startsWith('--'));
  const buildFilter = parseFilter(turboArgs);
  const devFilters = parseFilters(turboArgs);

  if (tasks.includes('dev')) {
    console.warn('[turbo-or-fallback] Dev fallback: use pnpm dev:api / dev:community / dev:coreknot / dev:website');
    if (devFilters.length === 0) {
      return run('pnpm', ['dev:api']);
    }
    let exitCode = 0;
    for (const devFilter of devFilters) {
      const code = run('pnpm', [`--filter=${devFilter}`, 'run', 'dev']);
      if (code !== 0) exitCode = code;
    }
    return exitCode;
  }

  let exitCode = 0;
  if (tasks.includes('build') && buildFilter) {
    const code = runPnpmTask('build', buildFilter);
    if (code !== 0) exitCode = code;
    tasks.splice(tasks.indexOf('build'), 1);
  }

  for (const task of tasks) {
    if (task === 'build') {
      const code = run('pnpm', ['-r', 'run', 'build']);
      if (code !== 0) exitCode = code;
      continue;
    }
    const code = run('pnpm', ['-r', 'run', task]);
    if (code !== 0) exitCode = code;
  }
  return exitCode;
}

const turboExit = run('pnpm', ['exec', 'turbo', ...args]);

if (TURBO_CRASH_EXITS.has(turboExit)) {
  console.warn(
    `[turbo-or-fallback] Turbo exited ${turboExit} (Windows native crash). Using pnpm fallback.`,
  );
  process.exit(runFallback(args));
}

process.exit(turboExit);
