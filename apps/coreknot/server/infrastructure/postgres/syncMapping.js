const SOURCE_SYSTEM = 'coreknot';

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} tscEntityType
 * @param {string} externalId
 */
async function findMappingByExternalId(prisma, tscEntityType, externalId) {
  if (!externalId) return null;
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

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} tscEntityType
 * @param {string} tscEntityId
 */
async function findMappingByTscId(prisma, tscEntityType, tscEntityId) {
  if (!tscEntityId) return null;
  return prisma.syncMapping.findFirst({
    where: {
      sourceSystem: SOURCE_SYSTEM,
      tscEntityType,
      tscEntityId: String(tscEntityId),
    },
  });
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} tscEntityType
 * @param {string | null | undefined} externalId
 */
async function resolveTscEntityId(prisma, tscEntityType, externalId) {
  const row = await findMappingByExternalId(prisma, tscEntityType, externalId);
  return row?.tscEntityId ?? null;
}

module.exports = {
  SOURCE_SYSTEM,
  findMappingByExternalId,
  findMappingByTscId,
  resolveTscEntityId,
};
