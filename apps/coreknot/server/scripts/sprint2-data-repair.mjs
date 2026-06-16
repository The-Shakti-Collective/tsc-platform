#!/usr/bin/env node
/**
 * Sprint 2 — remediate workspace/project/membership boundary drift (Neon).
 * Usage: node scripts/sprint2-data-repair.mjs [--dry-run]
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = join(__dirname, '..');

// Load .env without dotenv dependency in ESM
for (const line of readFileSync(join(serverRoot, '.env'), 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq);
  let val = trimmed.slice(eq + 1);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const dryRun = process.argv.includes('--dry-run');

const BOUNDARY_COUNTS_SQL = `
SELECT 'task_workspace_project_mismatch' AS check_name, COUNT(*)::int AS count
FROM "Task" t JOIN "Project" p ON t."projectId" = p.id
WHERE t."workspaceId" <> p."workspaceId"
UNION ALL
SELECT 'workspace_owner_not_member', COUNT(*)::int
FROM "Workspace" w
LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = w.id AND wm."personId" = w."ownerPersonId"
WHERE wm.id IS NULL
UNION ALL
SELECT 'task_assignee_not_workspace_member', COUNT(*)::int
FROM "TaskAssignee" ta
JOIN "Task" t ON ta."taskId" = t.id
LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = t."workspaceId"
  AND wm."personId" = ta."personId" AND wm.status = 'active'
WHERE wm.id IS NULL
UNION ALL
SELECT 'project_member_not_workspace_member', COUNT(*)::int
FROM "ProjectMember" pm
JOIN "Project" p ON pm."projectId" = p.id
LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = p."workspaceId"
  AND wm."personId" = pm."personId" AND wm.status = 'active'
WHERE wm.id IS NULL;
`;

async function main() {
  const { PrismaClient } = await import('@tsc/database/client');
  const prisma = new PrismaClient();

  try {
    console.log(`\n=== Sprint 2 Data Repair ${dryRun ? '(DRY RUN)' : ''} ===\n`);

    const before = await prisma.$queryRawUnsafe(BOUNDARY_COUNTS_SQL);
    console.log('BEFORE:', JSON.stringify(before, null, 2));

    if (dryRun) {
      console.log('\nDry run — no mutations applied.');
      return;
    }

    const summary = await prisma.$transaction(async (tx) => {
      const taskAlign = await tx.$executeRawUnsafe(`
        UPDATE "Task" t
        SET "workspaceId" = p."workspaceId"
        FROM "Project" p
        WHERE t."projectId" = p.id AND t."workspaceId" <> p."workspaceId"
      `);

      const ownerBackfill = await tx.$executeRawUnsafe(`
        INSERT INTO "WorkspaceMember" (id, "workspaceId", "personId", role, status, "joinedAt")
        SELECT gen_random_uuid()::text, w.id, w."ownerPersonId", 'owner', 'active', NOW()
        FROM "Workspace" w
        LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = w.id AND wm."personId" = w."ownerPersonId"
        WHERE wm.id IS NULL
      `);

      const assigneeBackfill = await tx.$executeRawUnsafe(`
        INSERT INTO "WorkspaceMember" (id, "workspaceId", "personId", role, status, "joinedAt")
        SELECT DISTINCT ON (t."workspaceId", ta."personId")
          gen_random_uuid()::text, t."workspaceId", ta."personId", 'member', 'active', NOW()
        FROM "TaskAssignee" ta
        JOIN "Task" t ON ta."taskId" = t.id
        LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = t."workspaceId"
          AND wm."personId" = ta."personId" AND wm.status = 'active'
        WHERE wm.id IS NULL
        ORDER BY t."workspaceId", ta."personId"
        ON CONFLICT ("workspaceId", "personId") DO NOTHING
      `);

      const projectMemberBackfill = await tx.$executeRawUnsafe(`
        INSERT INTO "WorkspaceMember" (id, "workspaceId", "personId", role, status, "joinedAt")
        SELECT DISTINCT ON (p."workspaceId", pm."personId")
          gen_random_uuid()::text, p."workspaceId", pm."personId", 'member', 'active', NOW()
        FROM "ProjectMember" pm
        JOIN "Project" p ON pm."projectId" = p.id
        LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = p."workspaceId"
          AND wm."personId" = pm."personId" AND wm.status = 'active'
        WHERE wm.id IS NULL
        ORDER BY p."workspaceId", pm."personId"
        ON CONFLICT ("workspaceId", "personId") DO NOTHING
      `);

      return { taskAlign, ownerBackfill, assigneeBackfill, projectMemberBackfill };
    });

    console.log('\nMUTATIONS:', JSON.stringify(summary, null, 2));

    const after = await prisma.$queryRawUnsafe(BOUNDARY_COUNTS_SQL);
    console.log('\nAFTER:', JSON.stringify(after, null, 2));

    const failures = after.filter((r) => Number(r.count) > 0);
    if (failures.length) {
      console.error('\nRemaining boundary issues:', failures);
      process.exit(1);
    }
    console.log('\nAll boundary checks at 0.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
