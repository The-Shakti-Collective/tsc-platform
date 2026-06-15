import { oid } from './lib/mongo.mjs';
import { PROJECT_STATUS_MAP } from './lib/mappings.mjs';
import { slugify, toDate } from './lib/utils.mjs';

/**
 * @param {import('mongodb').Document} input
 */
export function transformProjects(input) {
  const registrySlugs = new Set();
  const workspaces = [];
  const workspaceDocs = Array.isArray(input?.workspaces) ? input.workspaces : [];
  const projectDocs = Array.isArray(input?.projects) ? input.projects : [];
  const labelRows = Array.isArray(input?.workspaceLabels) ? input.workspaceLabels : [];
  const userDocs = Array.isArray(input?.users) ? input.users : [];

  for (const ws of workspaceDocs) {
    const name = String(ws.name || 'GENERAL').trim();
    const slug = slugify(name, 'general');
    registrySlugs.add(slug);
    workspaces.push({
      externalId: oid(ws),
      kind: 'registry',
      name,
      slug,
      tenantId: ws.tenantId ? String(ws.tenantId) : null,
      settings: {
        color: ws.color ?? null,
        order: ws.order ?? 0,
        defaultMembers: ws.defaultMembers ?? [],
      },
    });
  }

  for (const row of labelRows) {
    const name = String(row._id || 'General').trim();
    const slug = slugify(name, 'general');
    if (registrySlugs.has(slug)) continue;
    registrySlugs.add(slug);
    workspaces.push({
      externalId: `label:${slug}`,
      kind: 'project_label',
      name,
      slug,
      tenantId: null,
      settings: { source: 'project.workspace_distinct' },
    });
  }

  const projects = projectDocs.map((p) => {
    const externalId = oid(p);
    const workspaceName = String(p.workspace || 'General').trim();
    const statusKey = String(p.status || 'active').toLowerCase();
    return {
      externalId,
      tenantId: p.tenantId ? String(p.tenantId) : null,
      name: String(p.name || 'Untitled Project').trim(),
      slug: slugify(p.name, `project-${externalId?.slice(-6) ?? 'x'}`),
      description: p.description ?? null,
      status: PROJECT_STATUS_MAP[statusKey] ?? 'active',
      workspaceSlug: slugify(workspaceName, 'general'),
      workspaceName,
      ownerUserId: p.owner ? String(p.owner) : null,
      memberUserIds: Array.isArray(p.members) ? p.members.map((id) => String(id)) : [],
      metadata: {
        outletId: p.outletId ?? null,
        tags: p.tags ?? [],
        progress: p.progress ?? 0,
        totalTasksCount: p.totalTasksCount ?? 0,
        completedTasksCount: p.completedTasksCount ?? 0,
        linkedCalendars: p.linkedCalendars ?? [],
        color: p.color ?? null,
        starred: p.starred ?? false,
        memberRoles: p.memberRoles ?? [],
      },
      createdAt: toDate(p.createdAt),
      updatedAt: toDate(p.updatedAt) ?? toDate(p.createdAt),
    };
  });

  const firstUserId = userDocs[0] ? oid(userDocs[0]) : null;

  return { workspaces, projects, defaultOwnerUserId: firstUserId };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractProjects } = await import('./extract-projects.mjs');
  const raw = await extractProjects();
  console.log(JSON.stringify(transformProjects(raw), null, 2));
  process.exit(0);
}
