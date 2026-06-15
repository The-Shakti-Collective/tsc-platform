import { loadWithMapping } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractArtists } from './extract-artists.mjs';
import { transformArtists } from './transform-artists.mjs';

/**
 * @param {ReturnType<typeof transformArtists>} records
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadArtists(records, ctx) {
  const stats = { created: 0, skipped: 0, updated: 0 };

  for (const row of records) {
    await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      const result = await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Artist',
        dryRun: ctx.dryRun,
        metadata: { collection: 'artists', slug: row.slug },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-artist-${row.externalId.slice(-8)}`;

          if (existingId) {
            await tx.artist.update({
              where: { id: existingId },
              data: {
                name: row.name,
                displayName: row.name,
                slug: row.slug,
                bio: row.bio,
                photoUrl: row.photoUrl,
                metadata: row.metadata,
              },
            });
            stats.updated += 1;
            return existingId;
          }

          const existingSlug = await tx.artist.findUnique({ where: { slug: row.slug } });
          const slug = existingSlug ? `${row.slug}-${row.externalId.slice(-6)}` : row.slug;

          const artist = await tx.artist.create({
            data: {
              name: row.name,
              displayName: row.name,
              slug,
              bio: row.bio,
              photoUrl: row.photoUrl,
              metadata: row.metadata,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.created += 1;
          return artist.id;
        },
      });
      if (result.skipped) stats.skipped += 1;
    });
  }

  return stats;
}

export async function runArtistsMigration() {
  return runPipeline({
    entity: 'artists',
    extract: extractArtists,
    transform: transformArtists,
    load: loadArtists,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runArtistsMigration();
}
