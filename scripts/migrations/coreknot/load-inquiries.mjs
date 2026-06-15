import { loadWithMapping, resolveTscId } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractInquiries } from './extract-inquiries.mjs';
import { transformInquiries } from './transform-inquiries.mjs';

/**
 * @param {ReturnType<typeof transformInquiries>} records
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadInquiries(records, ctx) {
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
    const assignedPersonId = row.assignedUserId
      ? await resolveTscId(ctx.prisma, 'Person', row.assignedUserId)
      : null;

    await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      const result = await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Inquiry',
        dryRun: ctx.dryRun,
        metadata: { organizationId: orgId, artistId },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-inq-${row.externalId.slice(-8)}`;
          if (!orgId) throw new Error('organization required');

          const data = {
            organizationId: orgId,
            subject: row.subject,
            body: row.body,
            status: row.status,
            contactName: row.contactName,
            contactEmail: row.contactEmail,
            artistId: artistId ?? undefined,
            assignedPersonId: assignedPersonId ?? undefined,
            metadata: row.metadata,
          };

          if (existingId) {
            await tx.inquiry.update({ where: { id: existingId }, data });
            stats.updated += 1;
            return existingId;
          }

          const inquiry = await tx.inquiry.create({
            data: {
              ...data,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.created += 1;
          return inquiry.id;
        },
      });
      if (result.skipped) stats.skipped += 1;
    });
  }

  return stats;
}

export async function runInquiriesMigration() {
  return runPipeline({
    entity: 'inquiries',
    extract: extractInquiries,
    transform: transformInquiries,
    load: loadInquiries,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runInquiriesMigration();
}
