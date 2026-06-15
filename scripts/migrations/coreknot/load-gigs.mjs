import { loadWithMapping, resolveTscId } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractGigs } from './extract-gigs.mjs';
import { transformGigs } from './transform-gigs.mjs';

/**
 * @param {ReturnType<typeof transformGigs>} records
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadGigs(records, ctx) {
  const stats = { created: 0, skipped: 0, updated: 0, missingOrg: 0 };

  for (const row of records) {
    const orgId = row.organizationId
      ? await resolveTscId(ctx.prisma, 'Organization', row.organizationId)
      : null;
    if (!orgId && !ctx.dryRun) {
      stats.missingOrg += 1;
      continue;
    }

    const artistId = row.artistId
      ? await resolveTscId(ctx.prisma, 'Artist', row.artistId)
      : null;

    await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      const result = await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Gig',
        dryRun: ctx.dryRun,
        metadata: { organizationId: orgId, artistId },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-gig-${row.externalId.slice(-8)}`;
          if (!orgId) throw new Error('organization required');

          const data = {
            organizationId: orgId,
            artistId: artistId ?? undefined,
            title: row.title,
            venue: row.venue,
            city: row.city,
            startsAt: row.startsAt,
            status: row.status,
            fee: row.fee,
            currency: row.currency,
            notes: row.notes,
            metadata: row.metadata,
          };

          if (existingId) {
            await tx.gig.update({ where: { id: existingId }, data });
            stats.updated += 1;
            return existingId;
          }

          const gig = await tx.gig.create({
            data: {
              ...data,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.created += 1;
          return gig.id;
        },
      });
      if (result.skipped) stats.skipped += 1;
    });
  }

  return stats;
}

export async function runGigsMigration() {
  return runPipeline({
    entity: 'gigs',
    extract: extractGigs,
    transform: transformGigs,
    load: loadGigs,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runGigsMigration();
}
