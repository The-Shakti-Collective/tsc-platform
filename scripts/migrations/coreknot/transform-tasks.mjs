import { oid } from './lib/mongo.mjs';
import { TASK_PRIORITY_MAP, TASK_STATUS_MAP } from './lib/mappings.mjs';
import { slugify, toDate } from './lib/utils.mjs';

/**
 * @param {import('mongodb').Document[]} tasks
 */
export function transformTasks(tasks) {
  return tasks.map((t) => {
    const externalId = oid(t);
    const statusKey = String(t.status || 'todo').toLowerCase();
    const priorityKey = String(t.priority || 'medium').toLowerCase();
    const workspaceName = String(t.workspace || 'General').trim();

    return {
      externalId,
      tenantId: t.tenantId ? String(t.tenantId) : null,
      title: String(t.title || 'Untitled task').trim(),
      description: t.description ?? null,
      status: TASK_STATUS_MAP[statusKey] ?? 'todo',
      priority: TASK_PRIORITY_MAP[priorityKey] ?? 'medium',
      projectId: t.projectId ? String(t.projectId) : null,
      workspaceSlug: slugify(workspaceName, 'general'),
      createdByUserId: t.createdBy ? String(t.createdBy) : null,
      dueAt: toDate(t.dueDate),
      assigneeUserIds: (t._assignments ?? []).map((a) => String(a.userId)),
      metadata: {
        phaseId: t.phaseId ? String(t.phaseId) : null,
        parentTaskId: t.parentTaskId ? String(t.parentTaskId) : null,
        plannedHours: t.plannedHours ?? 0,
        actualHours: t.actualHours ?? 0,
        dependencies: (t.dependencies ?? []).map((id) => String(id)),
        scheduleSlot: t.scheduleSlot ?? null,
        scheduleDate: t.scheduleDate ? toDate(t.scheduleDate)?.toISOString() : null,
        mentionPersonIds: (t.mentionAccessIds ?? []).map((id) => String(id)),
        taskType: t.type ?? null,
        legacyStatus: t.status ?? null,
        legacyWorkspaceLabel: workspaceName,
      },
      createdAt: toDate(t.createdAt),
      updatedAt: toDate(t.updatedAt) ?? toDate(t.createdAt),
    };
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { extractTasks } = await import('./extract-tasks.mjs');
  const raw = await extractTasks();
  console.log(JSON.stringify(transformTasks(raw), null, 2));
  process.exit(0);
}
