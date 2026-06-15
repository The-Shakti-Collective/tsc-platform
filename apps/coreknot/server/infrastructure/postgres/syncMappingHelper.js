const { getPrismaClient } = require('./prismaClient');
const { SOURCE_SYSTEM } = require('./storeFlags');

async function findMapping(externalId, tscEntityType) {
  if (!externalId) return null;
  const prisma = await getPrismaClient();
  return prisma.syncMapping.findUnique({
    where: {
      sourceSystem_externalId_tscEntityType: {
        sourceSystem: SOURCE_SYSTEM,
        externalId: String(externalId),
        tscEntityType,
      },
    },
  });
}

async function resolveTscId(tscEntityType, externalId) {
  const row = await findMapping(externalId, tscEntityType);
  return row?.tscEntityId ?? null;
}

async function resolveMongoId(tscEntityType, tscEntityId) {
  if (!tscEntityId) return null;
  const prisma = await getPrismaClient();
  const row = await prisma.syncMapping.findFirst({
    where: {
      sourceSystem: SOURCE_SYSTEM,
      tscEntityType,
      tscEntityId: String(tscEntityId),
    },
    select: { externalId: true },
  });
  return row?.externalId ?? null;
}

async function resolveOrganizationId(tenantId) {
  if (!tenantId) return null;
  return resolveTscId('Organization', String(tenantId));
}

async function resolvePersonId(mongoUserId) {
  if (!mongoUserId) return null;
  return resolveTscId('Person', String(mongoUserId));
}

async function resolveMongoUserId(personId) {
  if (!personId) return null;
  return resolveMongoId('Person', personId);
}

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
      eventType: 'runtime_dual_write',
      metadata,
    },
    update: {
      tscEntityId: String(tscEntityId),
      eventType: 'runtime_dual_write',
      metadata,
    },
  });
}

module.exports = {
  findMapping,
  resolveTscId,
  resolveMongoId,
  resolveOrganizationId,
  resolvePersonId,
  resolveMongoUserId,
  upsertSyncMapping,
};
