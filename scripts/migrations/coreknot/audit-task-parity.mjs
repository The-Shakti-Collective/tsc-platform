#!/usr/bin/env node
/**
 * Diagnose Mongo task IDs missing from Postgres (syncMapping + load skip reasons).
 * Usage: node scripts/migrations/coreknot/audit-task-parity.mjs
 */
import { fetchAll, oid, closeMongo } from './lib/mongo.mjs';
import { getPrisma, disconnectPrisma } from './lib/prisma.mjs';
import { transformTasks } from './transform-tasks.mjs';
import { extractTasks } from './extract-tasks.mjs';
import { resolveTscId } from './lib/sync-mapping.mjs';
import { slugify } from './lib/utils.mjs';

async function main() {
  const raw = await extractTasks();
  await closeMongo();

  const prisma = getPrisma();
  const transformed = transformTasks(raw);

  const mappings = await prisma.syncMapping.findMany({
    where: { sourceSystem: 'coreknot', tscEntityType: 'Task' },
    select: { externalId: true, tscEntityId: true },
  });
  const mappedIds = new Set(mappings.map((m) => m.externalId));

  const missing = [];
  const skipReasons = { noCreator: 0, noWorkspace: 0, unmappedOther: 0 };

  for (const row of transformed) {
    if (mappedIds.has(row.externalId)) continue;

    let reason = 'unknown';
    const workspaceSlug = row.workspaceSlug;
    const workspaceId =
      (await resolveTscId(prisma, 'Workspace', `label:${workspaceSlug}`)) ??
      (await prisma.workspace.findUnique({ where: { slug: workspaceSlug } }))?.id ??
      null;

    const createdByPersonId = row.createdByUserId
      ? await resolveTscId(prisma, 'Person', row.createdByUserId)
      : null;

    if (!createdByPersonId) {
      reason = 'noCreator';
      skipReasons.noCreator += 1;
    } else if (!workspaceId) {
      reason = 'noWorkspace';
      skipReasons.noWorkspace += 1;
    } else {
      reason = 'unmappedOther';
      skipReasons.unmappedOther += 1;
    }

    missing.push({
      externalId: row.externalId,
      title: row.title.slice(0, 60),
      workspaceSlug,
      createdByUserId: row.createdByUserId,
      reason,
    });
  }

  const pgTaskCount = await prisma.task.count();
  const mongoCount = raw.length;
  const mappingCount = mappings.length;

  console.log('\n=== Task parity diagnostic ===\n');
  console.log(`Mongo tasks (extract):     ${mongoCount}`);
  console.log(`SyncMapping Task rows:     ${mappingCount}`);
  console.log(`Postgres task.count():     ${pgTaskCount}`);
  console.log(`Unmapped mongo tasks:      ${missing.length}`);
  console.log('\nSkip reason breakdown (unmapped):');
  console.log(JSON.stringify(skipReasons, null, 2));

  if (missing.length > 0) {
    console.log('\nFirst 25 unmapped tasks:');
    for (const m of missing.slice(0, 25)) {
      console.log(`  [${m.reason}] ${m.externalId} | ${m.title}`);
    }
  }

  const extraPg = pgTaskCount - mappingCount;
  if (extraPg > 0) {
    console.log(`\nNote: ${extraPg} Postgres tasks may exist without syncMapping (manual/seed).`);
  }

  await disconnectPrisma();
  process.exit(missing.length > 5 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
