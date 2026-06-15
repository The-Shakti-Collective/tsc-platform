#!/usr/bin/env node
/**
 * Compare Mongo P0 collection counts vs Postgres row counts (local migration parity).
 * Usage: node e2e/migration/count-parity.mjs [--json]
 * Env: COUNT_PARITY_TOLERANCE (default 5) — allowed |postgres - mongo| delta per entity.
 */
import { closeMongo, getMongoDb } from '../../scripts/migrations/coreknot/lib/mongo.mjs';
import { getPrisma, disconnectPrisma } from '../../scripts/migrations/coreknot/lib/prisma.mjs';

const PAIRS = [
  { mongo: 'tenants', pg: 'organization', label: 'Organizations' },
  { mongo: 'users', pg: 'user', label: 'Users' },
  { mongo: 'artists', pg: 'artist', label: 'Artists' },
  { mongo: 'projects', pg: 'project', label: 'Projects' },
  { mongo: 'tasks', pg: 'task', label: 'Tasks' },
  { mongo: 'leads', pg: 'lead', label: 'Leads' },
];

const P1_LEGACY = [
  { mongo: 'attendances', entityType: 'Attendance', label: 'Attendance' },
  { mongo: 'leaverequests', entityType: 'LeaveRequest', label: 'LeaveRequest' },
  { mongo: 'calendarevents', entityType: 'CalendarEvent', label: 'CalendarEvent' },
  { mongo: 'notifications', entityType: 'Notification', label: 'Notification' },
  { mongo: 'gamificationconfigs', entityType: 'GamificationConfig', label: 'GamificationConfig' },
  { mongo: 'dailymissions', entityType: 'DailyMission', label: 'DailyMission' },
  { mongo: 'xpauditlogs', entityType: 'XPAuditLog', label: 'XPAuditLog' },
  { mongo: 'newsletterissues', entityType: 'NewsletterIssue', label: 'NewsletterIssue' },
  { mongo: 'newsletterarticles', entityType: 'NewsletterArticle', label: 'NewsletterArticle' },
  { mongo: 'exlybookings', entityType: 'ExlyBooking', label: 'ExlyBooking' },
  { mongo: 'exlyofferings', entityType: 'ExlyOffering', label: 'ExlyOffering' },
  { mongo: 'financedocuments', entityType: 'FinanceDocument', label: 'FinanceDocument' },
  { mongo: 'mailcampaigns', entityType: 'MailCampaign', label: 'MailCampaign' },
  { mongo: 'personindices', entityType: 'DataHubPerson', label: 'DataHubPerson' },
];

const TOLERANCE = Number(process.env.COUNT_PARITY_TOLERANCE || 5);
const includeP1 = process.argv.includes('--p1') || process.env.COUNT_PARITY_P1 === 'true';

async function main() {
  const db = await getMongoDb();
  const mongo = {};
  for (const { mongo: coll } of PAIRS) {
    mongo[coll] = await db.collection(coll).estimatedDocumentCount();
  }
  if (includeP1) {
    for (const { mongo: coll } of P1_LEGACY) {
      mongo[coll] = await db.collection(coll).estimatedDocumentCount();
    }
  }
  await closeMongo();

  const prisma = getPrisma();
  const pg = {
    organization: await prisma.organization.count(),
    user: await prisma.user.count(),
    artist: await prisma.artist.count(),
    project: await prisma.project.count(),
    task: await prisma.task.count(),
    lead: await prisma.lead.count(),
  };
  const legacyCounts = {};
  if (includeP1) {
    const grouped = await prisma.ckLegacyDocument.groupBy({
      by: ['entityType'],
      _count: { _all: true },
    });
    for (const row of grouped) {
      legacyCounts[row.entityType] = row._count._all;
    }
  }
  const syncMapping = await prisma.syncMapping.count({
    where: { sourceSystem: 'coreknot' },
  });
  await disconnectPrisma();

  const rows = PAIRS.map(({ mongo: coll, pg: pgKey, label }) => {
    const m = mongo[coll] ?? 0;
    const p = pg[pgKey] ?? 0;
    const delta = p - m;
    const ok = Math.abs(delta) <= TOLERANCE;
    return { label, mongoCollection: coll, mongo: m, postgres: p, delta, ok };
  });

  const p1Rows = includeP1
    ? P1_LEGACY.map(({ mongo: coll, entityType, label }) => {
      const m = mongo[coll] ?? 0;
      const p = legacyCounts[entityType] ?? 0;
      const delta = p - m;
      const ok = Math.abs(delta) <= TOLERANCE;
      return { label, mongoCollection: coll, entityType, mongo: m, postgres: p, delta, ok };
    })
    : [];

  const allRows = [...rows, ...p1Rows];

  const payload = {
    sampledAt: new Date().toISOString(),
    tolerance: TOLERANCE,
    syncMappingCoreknot: syncMapping,
    rows: allRows,
    p1Included: includeP1,
    allWithinTolerance: allRows.every((r) => r.ok),
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log('\n=== Mongo vs Postgres count parity (P0) ===');
    console.log(`Tolerance: +/-${TOLERANCE} rows per entity\n`);
    for (const r of rows) {
      const mark = r.ok ? 'OK' : 'MISMATCH';
      console.log(
        `${mark.padEnd(9)} ${r.label.padEnd(14)} mongo=${String(r.mongo).padStart(5)}  pg=${String(r.postgres).padStart(5)}  delta=${r.delta >= 0 ? '+' : ''}${r.delta}`,
      );
    }
    if (includeP1) {
      console.log('\n=== P1 ck_legacy_documents parity ===\n');
      for (const r of p1Rows) {
        const mark = r.ok ? 'OK' : 'MISMATCH';
        console.log(
          `${mark.padEnd(9)} ${r.label.padEnd(18)} mongo=${String(r.mongo).padStart(5)}  legacy=${String(r.postgres).padStart(5)}  delta=${r.delta >= 0 ? '+' : ''}${r.delta}`,
        );
      }
    }
    console.log(`\nSyncMapping (coreknot): ${syncMapping}`);
    console.log(payload.allWithinTolerance ? '\nVerdict: WITHIN_TOLERANCE' : '\nVerdict: REVIEW_MISMATCHES');
  }

  process.exit(payload.allWithinTolerance ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
