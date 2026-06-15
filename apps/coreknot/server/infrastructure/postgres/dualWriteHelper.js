const logger = require('../../utils/logger');
const { getPrismaClient } = require('./prismaClient');
const { SOURCE_SYSTEM } = require('./storeFlags');

const RUNTIME_EVENT = 'runtime_dual_write';

/**
 * Upsert SyncMapping after a runtime dual-write.
 * @param {string} externalId Mongo ObjectId string
 * @param {string} tscEntityType e.g. Project, Task, Person
 * @param {string} tscEntityId Prisma cuid
 * @param {Record<string, unknown>} [metadata]
 */
async function upsertSyncMapping(externalId, tscEntityType, tscEntityId, metadata = {}) {
  const prisma = await getPrismaClient();
  return prisma.syncMapping.upsert({
    where: {
      sourceSystem_externalId_tscEntityType: {
        sourceSystem: SOURCE_SYSTEM,
        externalId: String(externalId),
        tscEntityType,
      },
    },
    create: {
      sourceSystem: SOURCE_SYSTEM,
      externalId: String(externalId),
      tscEntityType,
      tscEntityId: String(tscEntityId),
      eventType: RUNTIME_EVENT,
      metadata,
    },
    update: {
      tscEntityId: String(tscEntityId),
      eventType: RUNTIME_EVENT,
      metadata,
    },
  });
}

/**
 * Fire-and-forget Postgres mirror — logs warning on failure, never throws.
 * @param {() => Promise<void>} fn
 * @param {string} label
 */
function mirrorPostgres(fn, label) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      logger.warn('PostgresMirror', `${label}: ${err.message}`);
    }
  };
}

/**
 * Resolve workspace id from legacy workspace label slug.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} workspaceLabel
 */
async function resolveWorkspaceIdForLabel(prisma, workspaceLabel) {
  const name = String(workspaceLabel || 'GENERAL').trim();
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const bySlug = await prisma.workspace.findUnique({ where: { slug } });
  if (bySlug) return bySlug.id;
  const mapping = await prisma.syncMapping.findUnique({
    where: {
      sourceSystem_externalId_tscEntityType: {
        sourceSystem: SOURCE_SYSTEM,
        externalId: `label:${slug}`,
        tscEntityType: 'Workspace',
      },
    },
  });
  return mapping?.tscEntityId ?? null;
}

function slugify(value, fallback = 'item') {
  const base = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallback;
}

module.exports = {
  upsertSyncMapping,
  mirrorPostgres,
  resolveWorkspaceIdForLabel,
  slugify,
  RUNTIME_EVENT,
};
