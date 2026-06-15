import { loadWithMapping } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractOrganizations } from './extract-organizations.mjs';
import { transformOrganizations } from './transform-organizations.mjs';

/**
 * @param {ReturnType<typeof transformOrganizations>} records
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadOrganizations(records, ctx) {
  const stats = { created: 0, skipped: 0, updated: 0 };

  for (const row of records) {
    const result = await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      return loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Organization',
        dryRun: ctx.dryRun,
        metadata: { collection: 'tenants', slug: row.slug },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-org-${row.externalId.slice(-8)}`;

          if (existingId) {
            await tx.organization.update({
              where: { id: existingId },
              data: {
                name: row.name,
                metadata: row.metadata,
              },
            });
            stats.updated += 1;
            return existingId;
          }

          const org = await tx.organization.create({
            data: {
              name: row.name,
              slug: row.slug,
              type: 'agency',
              metadata: row.metadata,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.created += 1;
          return org.id;
        },
      });
    });

    if (result.skipped) stats.skipped += 1;
  }

  return stats;
}

export async function runOrganizationsMigration() {
  return runPipeline({
    entity: 'organizations',
    extract: extractOrganizations,
    transform: transformOrganizations,
    load: loadOrganizations,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runOrganizationsMigration();
}
