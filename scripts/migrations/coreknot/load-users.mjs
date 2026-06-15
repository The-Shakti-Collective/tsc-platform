import { loadWithMapping, resolveTscId } from './lib/sync-mapping.mjs';
import { withTransaction } from './lib/prisma.mjs';
import { runPipeline } from './lib/run-step.mjs';
import { extractUsers } from './extract-users.mjs';
import { transformUsers } from './transform-users.mjs';

/**
 * @param {ReturnType<typeof transformUsers>} records
 * @param {{ prisma: import('@prisma/client').PrismaClient, dryRun: boolean }} ctx
 */
export async function loadUsers(records, ctx) {
  const stats = { created: 0, skipped: 0, persons: 0, members: 0 };

  for (const row of records) {
    const orgId = row.tenantId
      ? await resolveTscId(ctx.prisma, 'Organization', row.tenantId)
      : null;

    if (!orgId && !ctx.dryRun) {
      console.warn(`[users] skip ${row.externalId}: org ${row.tenantId} not mapped`);
      continue;
    }

    await withTransaction(ctx.prisma, ctx.dryRun, async (tx) => {
      const personResult = await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'Person',
        dryRun: ctx.dryRun,
        metadata: { collection: 'users', kind: 'staff' },
        upsert: async (existingId) => {
          if (ctx.dryRun) return existingId ?? `dry-person-${row.externalId.slice(-8)}`;

          if (existingId) {
            await tx.person.update({
              where: { id: existingId },
              data: {
                name: row.person.name,
                email: row.person.email,
                phone: row.person.phone,
                metadata: row.person.metadata,
              },
            });
            return existingId;
          }

          const existingByEmail = await tx.person.findFirst({
            where: { email: row.person.email },
          });
          if (existingByEmail) {
            stats.persons += 1;
            return existingByEmail.id;
          }

          const person = await tx.person.create({
            data: {
              name: row.person.name,
              email: row.person.email,
              phone: row.person.phone,
              metadata: row.person.metadata,
              createdAt: row.createdAt ?? undefined,
              updatedAt: row.updatedAt ?? undefined,
            },
          });
          stats.persons += 1;
          return person.id;
        },
      });

      if (personResult.skipped) {
        stats.skipped += 1;
        return;
      }

      const personId = personResult.tscEntityId;
      if (ctx.dryRun) {
        stats.created += 1;
        return;
      }

      await tx.identity.upsert({
        where: { personId },
        create: {
          personId,
          displayName: row.identity.displayName,
          avatarUrl: row.identity.avatarUrl,
          metadata: row.identity.metadata,
        },
        update: {
          displayName: row.identity.displayName,
          avatarUrl: row.identity.avatarUrl,
          metadata: row.identity.metadata,
        },
      });

      await tx.user.upsert({
        where: { personId },
        create: {
          personId,
          clerkUserId: row.user.clerkUserId,
          platformRole: row.user.platformRole,
        },
        update: {
          platformRole: row.user.platformRole,
        },
      });

      if (orgId) {
        await tx.organizationMember.upsert({
          where: {
            organizationId_personId: { organizationId: orgId, personId },
          },
          create: {
            organizationId: orgId,
            personId,
            role: row.member.role,
            status: row.member.status,
          },
          update: {
            role: row.member.role,
            status: row.member.status,
          },
        });
        stats.members += 1;
      }

      await loadWithMapping({
        db: tx,
        externalId: row.externalId,
        tscEntityType: 'User',
        dryRun: false,
        metadata: { personId, organizationId: orgId },
        upsert: async () => personId,
      });

      stats.created += personResult.created ? 1 : 0;
    });
  }

  return stats;
}

export async function runUsersMigration() {
  return runPipeline({
    entity: 'users',
    extract: extractUsers,
    transform: transformUsers,
    load: loadUsers,
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  await runUsersMigration();
}
