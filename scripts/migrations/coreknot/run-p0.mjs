#!/usr/bin/env node
/**
 * CoreKnot P0 migration orchestrator.
 *
 * Usage:
 *   MONGODB_URI=... DATABASE_URL=... node scripts/migrations/coreknot/run-p0.mjs
 *   ... --execute
 *   ... --only=users,leads
 *
 * Env auto-load: repo `.env`, then `apps/coreknot/server/.env` (see load-migration-env.mjs).
 */
import { parseCliArgs, logStep } from './lib/env.mjs';
import { runOrganizationsMigration } from './load-organizations.mjs';
import { runUsersMigration } from './load-users.mjs';
import { runArtistsMigration } from './load-artists.mjs';
import { runLeadsMigration } from './load-leads.mjs';
import { runProjectsMigration } from './load-projects.mjs';
import { runTasksMigration } from './load-tasks.mjs';
import { runInquiriesMigration } from './load-inquiries.mjs';
import { runGigsMigration } from './load-gigs.mjs';

const STEPS = [
  { key: 'organizations', run: runOrganizationsMigration },
  { key: 'users', run: runUsersMigration },
  { key: 'artists', run: runArtistsMigration },
  { key: 'leads', run: runLeadsMigration },
  { key: 'projects', run: runProjectsMigration },
  { key: 'tasks', run: runTasksMigration },
  { key: 'inquiries', run: runInquiriesMigration },
  { key: 'gigs', run: runGigsMigration },
];

async function main() {
  const opts = parseCliArgs();
  const selected = opts.only ? new Set(opts.only) : null;

  logStep('p0', opts.dryRun ? 'DRY RUN — pass --execute to write' : 'EXECUTE');

  const summary = {};
  for (const step of STEPS) {
    if (selected && !selected.has(step.key)) {
      logStep('p0', `skip ${step.key}`);
      continue;
    }
    logStep('p0', `start ${step.key}`);
    summary[step.key] = await step.run();
  }

  console.log('\n=== P0 migration summary ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
