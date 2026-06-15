const { getPrismaClient, isPostgresStoreEnabled } = require('../infrastructure/postgres/prismaClient');
const { createTenantRepository } = require('./createTenantRepository');
const { getTenantId } = require('../utils/tenantContext');
const { idFilter } = require('../utils/mongoId');

/**
 * Factory for Wave 2 domains — mirrors Mongo docs into ck_legacy_documents when flag=postgres.
 * @param {object} opts
 * @param {import('mongoose').Model} opts.MongoModel
 * @param {string} opts.entityType SyncMapping / CkLegacyDocument entity key
 * @param {string} opts.flagName e.g. COREKNOT_MAIL_STORE
 */
function createLegacyRepository({ MongoModel, entityType, flagName }) {
  const mongoRepo = createTenantRepository(MongoModel);

  const isPostgresEnabled = () => isPostgresStoreEnabled(flagName);

  function toMongoShape(row) {
    const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
    return {
      ...payload,
      _id: row.mongoId,
      id: row.mongoId,
      tenantId: row.tenantId ?? payload.tenantId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _readSource: 'postgres',
    };
  }

  async function findPostgresDocs(filter = {}, options = {}) {
    const prisma = await getPrismaClient();
    const tenantId = options.tenantId || getTenantId();
    const where = { entityType };
    if (tenantId) where.tenantId = String(tenantId);

    if (filter._id || filter.id) {
      where.mongoId = String(filter._id || filter.id);
    }

    const rows = await prisma.ckLegacyDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: options.limit,
      skip: options.skip,
    });

    return rows.map(toMongoShape);
  }

  async function mirrorToPostgres(mongoDoc) {
    if (!isPostgresEnabled()) return;
    const prisma = await getPrismaClient();
    const mongoId = mongoDoc._id.toString();
    const plain = mongoDoc.toObject ? mongoDoc.toObject() : { ...mongoDoc };
    delete plain._id;
    delete plain.__v;
    const tenantId = plain.tenantId?.toString?.() || plain.tenantId || getTenantId() || null;

    await prisma.ckLegacyDocument.upsert({
      where: { entityType_mongoId: { entityType, mongoId } },
      create: {
        entityType,
        mongoId,
        tenantId,
        payload: plain,
      },
      update: {
        tenantId,
        payload: plain,
      },
    });
  }

  async function deleteMirror(mongoId) {
    if (!isPostgresEnabled()) return;
    const prisma = await getPrismaClient();
    await prisma.ckLegacyDocument.deleteMany({
      where: { entityType, mongoId: String(mongoId) },
    });
  }

  function usePostgres(options = {}) {
    return isPostgresEnabled() && !options.bypass;
  }

  function hasComplexMongoFilter(filter = {}) {
    return Boolean(filter.$or || filter.$and || filter.date || filter.$gte || filter.$lte);
  }

  return {
    entityType,
    flagName,
    isPostgresEnabled,

    find(filter = {}, options = {}) {
      if (!usePostgres(options) || hasComplexMongoFilter(filter)) {
        return mongoRepo.find(filter, options);
      }
      return findPostgresDocs(filter, options);
    },

    findOne(filter = {}, options = {}) {
      if (!usePostgres(options) || hasComplexMongoFilter(filter)) {
        return mongoRepo.findOne(filter, options);
      }
      return findPostgresDocs(filter, { ...options, limit: 1 }).then((r) => r[0] || null);
    },

    findById(id, options = {}) {
      return this.findOne({ _id: id }, options);
    },

    countDocuments(filter = {}, options = {}) {
      if (!usePostgres(options) || hasComplexMongoFilter(filter)) {
        return mongoRepo.countDocuments(filter, options);
      }
      return findPostgresDocs(filter, options).then((rows) => rows.length);
    },

    async create(doc) {
      const created = await mongoRepo.create(doc);
      await mirrorToPostgres(created);
      return created;
    },

    async findOneAndUpdate(filter, update, options = {}) {
      const updated = await mongoRepo.findOneAndUpdate(filter, update, options);
      if (updated) await mirrorToPostgres(updated);
      return updated;
    },

    async findByIdAndUpdate(id, update, options = {}) {
      const updated = await mongoRepo.findByIdAndUpdate(id, update, options);
      if (updated) await mirrorToPostgres(updated);
      return updated;
    },

    async deleteOne(filter, options = {}) {
      const doc = await mongoRepo.findOne(filter, options);
      if (!doc) return null;
      const result = await mongoRepo.deleteOne(filter, options);
      await deleteMirror(doc._id);
      return result;
    },

    mirrorToPostgres,
    mongoRepo,
  };
}

module.exports = { createLegacyRepository };
