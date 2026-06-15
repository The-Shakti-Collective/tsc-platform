import { loadWithMapping, resolveTscId } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractLeads } from './extract-leads.mjs';
import { transformLeads } from './transform-leads.mjs';

/**
 * @param {ReturnType<typeof transformLeads>} records
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadLeads(records, ctx) {
  const stats = { created: 0, skipped: 0, updated: 0, missingOrg: 0 };

  for (const row of records) {
    const orgId =
      !row.organizationId
        ? null
        : ctx.dryRun
          ? null
          : await resolveTscId(ctx.prisma, 'Organization', row.organizationId);

    if (!orgId && !ctx.dryRun) {
      stats.missingOrg += 1;
      continue;
    }

    const assignedPersonId =
      !row.assignedUserId
        ? null
        : ctx.dryRun
          ? null
          : await resolveTscId(ctx.prisma, 'Person', row.assignedUserId);

    await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      const result = await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Lead',
        dryRun: ctx.dryRun,
        metadata: { collection: 'leads', organizationId: orgId },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-lead-${row.externalId.slice(-8)}`;
          if (!orgId) throw new Error('organization required');

          const data = {
            organizationId: orgId,
            name: row.name,
            email: row.email,
            phone: row.phone,
            source: row.source,
            stage: row.stage,
            assignedPersonId,
            notes: row.notes,
            metadata: row.metadata,
          };

          if (existingId) {
            await tx.lead.update({ where: { id: existingId }, data });
            stats.updated += 1;
            return existingId;
          }

          const lead = await tx.lead.create({
            data: {
              ...data,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.created += 1;
          return lead.id;
        },
      });
      if (result.skipped) stats.skipped += 1;
    });
  }

  return stats;
}

export async function runLeadsMigration() {
  return runPipeline({
    entity: 'leads',
    extract: extractLeads,
    transform: transformLeads,
    load: loadLeads,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runLeadsMigration();
}
