import { loadWithMapping, resolveTscId } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractTasks } from './extract-tasks.mjs';
import { transformTasks } from './transform-tasks.mjs';

/**
 * @param {ReturnType<typeof transformTasks>} records
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadTasks(records, ctx) {
  const stats = { created: 0, skipped: 0, updated: 0, missingWorkspace: 0 };

  for (const row of records) {
    const workspaceId =
      (await resolveTscId(ctx.prisma, 'Workspace', `label:${row.workspaceSlug}`)) ??
      (await ctx.prisma.workspace.findUnique({ where: { slug: row.workspaceSlug } }))?.id ??
      null;

    if (!workspaceId && !ctx.dryRun) {
      stats.missingWorkspace += 1;
      continue;
    }

    const resolvedWorkspaceId = workspaceId ?? `dry-ws-${row.workspaceSlug}`;

    const projectId = row.projectId
      ? await resolveTscId(ctx.prisma, 'Project', row.projectId)
      : null;

    const createdByPersonId = row.createdByUserId
      ? await resolveTscId(ctx.prisma, 'Person', row.createdByUserId)
      : null;

    if (!createdByPersonId && !ctx.dryRun) continue;

    await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      const result = await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Task',
        dryRun: ctx.dryRun,
        metadata: { workspaceSlug: row.workspaceSlug, projectId },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-task-${row.externalId.slice(-8)}`;
          if (!resolvedWorkspaceId || !createdByPersonId) {
            throw new Error('workspace + creator required');
          }

          const data = {
            workspaceId: resolvedWorkspaceId,
            projectId: projectId ?? undefined,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            dueAt: row.dueAt ?? undefined,
            createdByPersonId,
            metadata: row.metadata,
          };

          if (existingId) {
            await tx.task.update({ where: { id: existingId }, data });
            stats.updated += 1;
            return existingId;
          }

          const task = await tx.task.create({
            data: {
              ...data,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.created += 1;

          for (const userId of row.assigneeUserIds) {
            const personId = await resolveTscId(tx, 'Person', userId);
            if (!personId) continue;
            await tx.taskAssignee.upsert({
              where: { taskId_personId: { taskId: task.id, personId } },
              create: { taskId: task.id, personId },
              update: {},
            });
          }

          return task.id;
        },
      });
      if (result.skipped) stats.skipped += 1;
    });
  }

  return stats;
}

export async function runTasksMigration() {
  return runPipeline({
    entity: 'tasks',
    extract: extractTasks,
    transform: transformTasks,
    load: loadTasks,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runTasksMigration();
}
