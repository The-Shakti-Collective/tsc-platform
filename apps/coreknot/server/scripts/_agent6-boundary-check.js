const path = require('path');
process.chdir(path.join(__dirname, '..'));
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const { PrismaClient } = await import('@tsc/database/client');
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRawUnsafe(`
SELECT 'Workspace owner not member' AS check_name, COUNT(*)::int AS count
FROM "Workspace" w
LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = w.id AND wm."personId" = w."ownerPersonId"
WHERE wm.id IS NULL
UNION ALL
SELECT 'Task assignee not workspace member', COUNT(*)::int
FROM "TaskAssignee" ta
JOIN "Task" t ON ta."taskId" = t.id
LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = t."workspaceId" AND wm."personId" = ta."personId" AND wm.status = 'active'
WHERE wm.id IS NULL
UNION ALL
SELECT 'Project member not workspace member', COUNT(*)::int
FROM "ProjectMember" pm
JOIN "Project" p ON pm."projectId" = p.id
LEFT JOIN "WorkspaceMember" wm ON wm."workspaceId" = p."workspaceId" AND wm."personId" = pm."personId" AND wm.status = 'active'
WHERE wm.id IS NULL
UNION ALL
SELECT 'Lead assigned to non-member (boundary)', COUNT(*)::int
FROM "Lead" l
JOIN "Person" p ON l."assignedPersonId" = p.id
LEFT JOIN "OrganizationMember" om ON om."organizationId" = l."organizationId" AND om."personId" = l."assignedPersonId" AND om.status = 'active'
WHERE l."assignedPersonId" IS NOT NULL AND om.id IS NULL;
    `);
    console.log(JSON.stringify(rows, null, 2));

    const sample = await prisma.$queryRawUnsafe(`
SELECT t.id AS task_id, t."workspaceId", p.id AS project_id, p."workspaceId" AS project_workspace_id
FROM "Task" t
JOIN "Project" p ON t."projectId" = p.id
WHERE t."workspaceId" <> p."workspaceId"
LIMIT 5;
    `);
    console.log('MISMATCH_SAMPLE', JSON.stringify(sample, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
