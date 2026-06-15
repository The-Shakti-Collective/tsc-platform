import { loadWithMapping, resolveTscId } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractProjects } from './extract-projects.mjs';
import { transformProjects } from './transform-projects.mjs';

/** @type {Map<string, string>} */
const workspaceSlugToId = new Map();

/**
 * @param {ReturnType<typeof transformProjects>} bundle
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadProjects(bundle, ctx) {
  const stats = {
    workspacesCreated: 0,
    workspacesSkipped: 0,
    projectsCreated: 0,
    projectsSkipped: 0,
    projectsUpdated: 0,
  };

  const workspaces = Array.isArray(bundle?.workspaces) ? bundle.workspaces : [];
  const projects = Array.isArray(bundle?.projects) ? bundle.projects : [];

  for (const ws of workspaces) {
    const ownerPersonId = bundle.defaultOwnerUserId
      ? await resolveTscId(ctx.prisma, 'Person', bundle.defaultOwnerUserId)
      : null;

    const result = await loadWithMapping({
      db: ctx.prisma,
      externalId: ws.externalId,
      tscEntityType: 'Workspace',
      dryRun: ctx.dryRun,
      metadata: { slug: ws.slug, kind: ws.kind },
      upsert: async (existingId) => {
        if (ctx.dryRun) return existingId ?? `dry-ws-${ws.slug}`;

        if (existingId) {
          workspaceSlugToId.set(ws.slug, existingId);
          return existingId;
        }

        const existingBySlug = await ctx.prisma.workspace.findUnique({
          where: { slug: ws.slug },
        });
        if (existingBySlug) {
          workspaceSlugToId.set(ws.slug, existingBySlug.id);
          return existingBySlug.id;
        }

        if (!ownerPersonId) {
          throw new Error('workspace owner Person required — run users migration first');
        }

        const row = await ctx.prisma.workspace.create({
          data: {
            slug: ws.slug,
            name: ws.name,
            type: 'agency',
            ownerPersonId,
            settings: ws.settings,
          },
        });
        workspaceSlugToId.set(ws.slug, row.id);
        stats.workspacesCreated += 1;
        return row.id;
      },
    });

    if (result.skipped) stats.workspacesSkipped += 1;
    if (!ctx.dryRun && result.tscEntityId) {
      workspaceSlugToId.set(ws.slug, result.tscEntityId);
    } else if (ctx.dryRun) {
      workspaceSlugToId.set(ws.slug, result.tscEntityId);
    }
  }

  for (const row of projects) {
    let workspaceId = workspaceSlugToId.get(row.workspaceSlug);
    if (!workspaceId && !ctx.dryRun) {
      workspaceId = await resolveTscId(
        ctx.prisma,
        'Workspace',
        `label:${row.workspaceSlug}`,
      );
    }
    if (!workspaceId && ctx.dryRun) {
      workspaceId = `dry-ws-${row.workspaceSlug}`;
    }
    if (!workspaceId) continue;

    const ownerPersonId = row.ownerUserId
      ? await resolveTscId(ctx.prisma, 'Person', row.ownerUserId)
      : null;

    await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      const result = await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Project',
        dryRun: ctx.dryRun,
        metadata: { workspaceId, workspaceSlug: row.workspaceSlug },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-proj-${row.externalId.slice(-8)}`;

          const data = {
            workspaceId,
            slug: row.slug,
            name: row.name,
            type: 'general',
            description: row.description,
            status: row.status,
            metadata: {
              ...row.metadata,
              legacyWorkspaceLabel: row.workspaceName,
            },
          };

          if (existingId) {
            await tx.project.update({ where: { id: existingId }, data });
            stats.projectsUpdated += 1;
            return existingId;
          }

          const existingSlug = await tx.project.findUnique({
            where: { workspaceId_slug: { workspaceId, slug: row.slug } },
          });
          const slug = existingSlug
            ? `${row.slug}-${row.externalId.slice(-6)}`
            : row.slug;

          const project = await tx.project.create({
            data: {
              ...data,
              slug,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.projectsCreated += 1;

          if (ownerPersonId) {
            await tx.projectMember.upsert({
              where: {
                projectId_personId: { projectId: project.id, personId: ownerPersonId },
              },
              create: { projectId: project.id, personId: ownerPersonId, role: 'owner' },
              update: { role: 'owner' },
            });
          }

          return project.id;
        },
      });
      if (result.skipped) stats.projectsSkipped += 1;
    });
  }

  return stats;
}

export async function runProjectsMigration() {
  return runPipeline({
    entity: 'projects',
    extract: extractProjects,
    transform: transformProjects,
    load: loadProjects,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runProjectsMigration();
}
