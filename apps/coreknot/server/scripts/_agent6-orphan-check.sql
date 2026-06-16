SELECT 'Workspace orphan owner' AS check_name, COUNT(*)::int AS orphan_count
FROM "Workspace" w LEFT JOIN "Person" p ON w."ownerPersonId" = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'WorkspaceMember orphan workspace', COUNT(*)::int
FROM "WorkspaceMember" wm LEFT JOIN "Workspace" w ON wm."workspaceId" = w.id WHERE w.id IS NULL
UNION ALL
SELECT 'WorkspaceMember orphan person', COUNT(*)::int
FROM "WorkspaceMember" wm LEFT JOIN "Person" p ON wm."personId" = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'Project orphan workspace', COUNT(*)::int
FROM "Project" pr LEFT JOIN "Workspace" w ON pr."workspaceId" = w.id WHERE w.id IS NULL
UNION ALL
SELECT 'Task orphan workspace', COUNT(*)::int
FROM "Task" t LEFT JOIN "Workspace" w ON t."workspaceId" = w.id WHERE w.id IS NULL
UNION ALL
SELECT 'Task orphan project', COUNT(*)::int
FROM "Task" t LEFT JOIN "Project" p ON t."projectId" = p.id WHERE t."projectId" IS NOT NULL AND p.id IS NULL
UNION ALL
SELECT 'Task orphan creator', COUNT(*)::int
FROM "Task" t LEFT JOIN "Person" p ON t."createdByPersonId" = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'Task workspace-project mismatch', COUNT(*)::int
FROM "Task" t JOIN "Project" p ON t."projectId" = p.id WHERE t."workspaceId" <> p."workspaceId"
UNION ALL
SELECT 'TaskAssignee orphan task', COUNT(*)::int
FROM "TaskAssignee" ta LEFT JOIN "Task" t ON ta."taskId" = t.id WHERE t.id IS NULL
UNION ALL
SELECT 'TaskAssignee orphan person', COUNT(*)::int
FROM "TaskAssignee" ta LEFT JOIN "Person" p ON ta."personId" = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'Lead orphan organization', COUNT(*)::int
FROM "Lead" l LEFT JOIN "Organization" o ON l."organizationId" = o.id WHERE o.id IS NULL
UNION ALL
SELECT 'Lead orphan assignee', COUNT(*)::int
FROM "Lead" l LEFT JOIN "Person" p ON l."assignedPersonId" = p.id WHERE l."assignedPersonId" IS NOT NULL AND p.id IS NULL
UNION ALL
SELECT 'OrganizationMember orphan org', COUNT(*)::int
FROM "OrganizationMember" om LEFT JOIN "Organization" o ON om."organizationId" = o.id WHERE o.id IS NULL
UNION ALL
SELECT 'OrganizationMember orphan person', COUNT(*)::int
FROM "OrganizationMember" om LEFT JOIN "Person" p ON om."personId" = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'Lead assignee not org member', COUNT(*)::int
FROM "Lead" l JOIN "Person" p ON l."assignedPersonId" = p.id
LEFT JOIN "OrganizationMember" om ON om."organizationId" = l."organizationId" AND om."personId" = l."assignedPersonId"
WHERE l."assignedPersonId" IS NOT NULL AND om.id IS NULL
UNION ALL
SELECT 'CkLegacyStaffUser orphan tenant', COUNT(*)::int
FROM ck_legacy_staff_users u LEFT JOIN ck_legacy_tenants t ON u."tenantId" = t.id WHERE t.id IS NULL
UNION ALL
SELECT 'CkLegacyStaffUser orphan department', COUNT(*)::int
FROM ck_legacy_staff_users u LEFT JOIN ck_legacy_departments d ON u."departmentId" = d.id WHERE u."departmentId" IS NOT NULL AND d.id IS NULL
UNION ALL
SELECT 'CkLegacyDepartment orphan tenant', COUNT(*)::int
FROM ck_legacy_departments d LEFT JOIN ck_legacy_tenants t ON d."tenantId" = t.id WHERE t.id IS NULL;
