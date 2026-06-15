#!/usr/bin/env node
/**
 * CoreKnot P1 migration orchestrator — legacy domains → ck_legacy_documents.
 *
 * Usage:
 *   MONGODB_URI=... DATABASE_URL=... node scripts/migrations/coreknot/run-p1.mjs
 *   ... --execute
 *   ... --only=attendance,calendar
 */
import { parseCliArgs, logStep } from './lib/env.mjs';
import { runLegacyDocumentsMigration } from './load-legacy-documents.mjs';

const STEPS = [
  { key: 'attendance', entityType: 'Attendance', mongoCollection: 'attendances' },
  { key: 'leave', entityType: 'LeaveRequest', mongoCollection: 'leaverequests' },
  { key: 'calendar', entityType: 'CalendarEvent', mongoCollection: 'calendarevents' },
  { key: 'notification', entityType: 'Notification', mongoCollection: 'notifications' },
  { key: 'gamification', entityType: 'GamificationConfig', mongoCollection: 'gamificationconfigs' },
  { key: 'daily-mission', entityType: 'DailyMission', mongoCollection: 'dailymissions' },
  { key: 'xp-audit', entityType: 'XPAuditLog', mongoCollection: 'xpauditlogs' },
  { key: 'newsletter', entityType: 'NewsletterIssue', mongoCollection: 'newsletterissues' },
  { key: 'newsletter-article', entityType: 'NewsletterArticle', mongoCollection: 'newsletterarticles' },
  { key: 'integrations', entityType: 'ExlyBooking', mongoCollection: 'exlybookings' },
  { key: 'exly-offering', entityType: 'ExlyOffering', mongoCollection: 'exlyofferings' },
  { key: 'finance', entityType: 'FinanceDocument', mongoCollection: 'financedocuments' },
  { key: 'mail', entityType: 'MailCampaign', mongoCollection: 'mailcampaigns' },
  { key: 'datahub', entityType: 'DataHubPerson', mongoCollection: 'personindices' },
];

async function main() {
  const opts = parseCliArgs();
  const selected = opts.only ? new Set(opts.only) : null;

  logStep('p1', opts.dryRun ? 'DRY RUN — pass --execute to write' : 'EXECUTE');

  const summary = {};
  for (const step of STEPS) {
    if (selected && !selected.has(step.key)) {
      logStep('p1', `skip ${step.key}`);
      continue;
    }
    logStep('p1', `start ${step.key}`);
    summary[step.key] = await runLegacyDocumentsMigration({
      entityType: step.entityType,
      mongoCollection: step.mongoCollection,
      dryRun: opts.dryRun,
      batchSize: opts.batchSize,
    });
  }

  console.log('\n=== P1 migration summary ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
