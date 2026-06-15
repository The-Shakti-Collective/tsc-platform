import { SOURCE_SYSTEM, MIGRATION_EVENT } from './env.mjs';

/**
 * @typedef {Object} SyncMappingInput
 * @property {string} externalId
 * @property {string} tscEntityType
 * @property {string} tscEntityId
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {string} externalId
 * @param {string} tscEntityType
 */
export async function findMapping(db, externalId, tscEntityType) {
  return db.syncMapping.findUnique({
    where: {
      sourceSystem_externalId_tscEntityType: {
        sourceSystem: SOURCE_SYSTEM,
        externalId,
        tscEntityType,
      },
    },
  });
}

/**
 * Resolve TSC id from SyncMapping; returns null if not migrated yet.
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {string} tscEntityType
 * @param {string | null | undefined} externalId
 */
export async function resolveTscId(db, tscEntityType, externalId) {
  if (!externalId) return null;
  const row = await findMapping(db, externalId, tscEntityType);
  return row?.tscEntityId ?? null;
}

/**
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {SyncMappingInput} input
 */
export async function upsertMapping(db, input) {
  return db.syncMapping.upsert({
    where: {
      sourceSystem_externalId_tscEntityType: {
        sourceSystem: SOURCE_SYSTEM,
        externalId: input.externalId,
        tscEntityType: input.tscEntityType,
      },
    },
    create: {
      sourceSystem: SOURCE_SYSTEM,
      externalId: input.externalId,
      tscEntityType: input.tscEntityType,
      tscEntityId: input.tscEntityId,
      eventType: MIGRATION_EVENT,
      metadata: input.metadata ?? {},
    },
    update: {
      tscEntityId: input.tscEntityId,
      eventType: MIGRATION_EVENT,
      metadata: input.metadata ?? {},
    },
  });
}

/**
 * Idempotent entity loader: skip if mapping exists unless forceUpdate.
 * @template T
 * @param {object} opts
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} opts.db
 * @param {string} opts.externalId
 * @param {string} opts.tscEntityType
 * @param {boolean} opts.dryRun
 * @param {Record<string, unknown>} [opts.metadata]
 * @param {(existingId: string | null) => Promise<string>} opts.upsert
 */
export async function loadWithMapping({
  db,
  externalId,
  tscEntityType,
  dryRun,
  metadata,
  upsert,
}) {
  const existing = await findMapping(db, externalId, tscEntityType);
  if (existing && !process.env.MIGRATION_FORCE_UPDATE) {
    return { tscEntityId: existing.tscEntityId, created: false, skipped: true };
  }

  if (dryRun) {
    const fakeId = existing?.tscEntityId ?? `dry-${tscEntityType}-${externalId.slice(-8)}`;
    return { tscEntityId: fakeId, created: !existing, skipped: false };
  }

  const tscEntityId = await upsert(existing?.tscEntityId ?? null);
  await upsertMapping(db, {
    externalId,
    tscEntityType,
    tscEntityId,
    metadata,
  });
  return { tscEntityId, created: !existing, skipped: false };
}
