const Lead = require('../domains/crm/models/Lead');
const { createTenantRepository } = require('./createTenantRepository');
const { getPrismaClient } = require('../infrastructure/postgres/prismaClient');
const { isPostgresCrmEnabled } = require('../infrastructure/postgres/prismaClient');
const {
  mirrorLeadFromMongo,
  deleteLeadMirror,
} = require('../infrastructure/postgres/postgresEntityWrites');
const {
  resolveTscId,
  resolveMongoId,
  resolveOrganizationId,
  resolveMongoUserId,
} = require('../infrastructure/postgres/syncMappingHelper');
const { mapLeadRow } = require('../infrastructure/postgres/postgresEntityMappers');
const { getTenantId } = require('../utils/tenantContext');
const { isObjectIdString } = require('../utils/mongoId');

const mongoRepo = createTenantRepository(Lead);

async function resolveLeadMongoId(id) {
  if (!id) return null;
  const str = String(id);
  if (isObjectIdString(str)) return str;
  return resolveMongoId('Lead', str);
}

async function resolveLeadTscId(id) {
  if (!id) return null;
  const str = String(id);
  const byMapping = await resolveTscId('Lead', str);
  if (byMapping) return byMapping;
  if (!isObjectIdString(str)) return str;
  return null;
}

async function hydrateLead(row, tenantId) {
  const mongoId = await resolveMongoId('Lead', row.id);
  const assignedRepMongoId = row.assignedPersonId
    ? await resolveMongoUserId(row.assignedPersonId)
    : null;
  return mapLeadRow(row, {
    mongoId: mongoId || row.id,
    tenantId,
    assignedRepMongoId,
  });
}

async function tenantOrgWhere(options = {}) {
  const tenantId = options.tenantId || getTenantId();
  const organizationId = await resolveOrganizationId(tenantId);
  if (!organizationId) return null;
  return { organizationId };
}

async function findPostgresLeads(filter = {}, options = {}) {
  const prisma = await getPrismaClient();
  const tenantId = options.tenantId || getTenantId();
  const orgWhere = await tenantOrgWhere(options);
  if (!orgWhere) return [];

  const where = { ...orgWhere };

  if (filter._id || filter.id) {
    const tscId = await resolveLeadTscId(filter._id || filter.id);
    if (!tscId) return [];
    where.id = tscId;
  }

  if (filter.crmType) where.metadata = { path: ['crmType'], equals: filter.crmType };

  if (filter.assignedRepId === null) {
    where.assignedPersonId = null;
  } else if (filter.assignedRepId) {
    const personId = await resolveTscId('Person', String(filter.assignedRepId));
    if (personId) where.assignedPersonId = personId;
  }

  if (filter.leadStatus) {
    const { STAGE_TO_LEAD_STATUS } = require('../infrastructure/postgres/postgresEntityMappers');
    const stageEntry = Object.entries(STAGE_TO_LEAD_STATUS).find(([, v]) => v === filter.leadStatus);
    if (stageEntry) where.stage = stageEntry[0];
  }

  if (filter.source) where.source = filter.source;

  const rows = await prisma.lead.findMany({
    where,
    orderBy: { [options.sortField || 'createdAt']: options.sortOrder || 'desc' },
    take: options.limit,
    skip: options.skip,
  });

  let shaped = await Promise.all(rows.map((row) => hydrateLead(row, tenantId)));

  if (filter.$or) {
    const term = filter.$or.find((c) => c.name?.$regex)?.name?.$regex
      || filter.$or[0]?.email?.$regex;
    if (term) {
      const needle = String(term).toLowerCase();
      shaped = shaped.filter((l) => (
        String(l.name || '').toLowerCase().includes(needle)
        || String(l.email || '').toLowerCase().includes(needle)
        || String(l.phone || '').toLowerCase().includes(needle)
        || String(l.city || '').toLowerCase().includes(needle)
      ));
    }
  }

  return shaped;
}

async function countPostgresLeads(filter = {}, options = {}) {
  const rows = await findPostgresLeads(filter, options);
  return rows.length;
}

function usePostgres(options = {}) {
  return isPostgresCrmEnabled() && !options.bypass;
}

function chainableQuery(rowsOrPromise) {
  const promise = Promise.resolve(rowsOrPromise);
  return {
    lean: () => promise,
    select: () => chainableQuery(rowsOrPromise),
    populate: () => chainableQuery(rowsOrPromise),
    sort: () => chainableQuery(rowsOrPromise),
    skip: () => chainableQuery(rowsOrPromise),
    limit: () => chainableQuery(rowsOrPromise),
    cursor: () => {
      let index = 0;
      return {
        on(event, handler) {
          if (event === 'data') {
            promise.then((rows) => {
              const tick = () => {
                if (index < rows.length) {
                  handler(rows[index]);
                  index += 1;
                  setImmediate(tick);
                } else if (event === 'end') handler();
              };
              rows.forEach((row) => handler(row));
            });
          }
          if (event === 'end') promise.then(() => handler());
          if (event === 'error') promise.catch((err) => handler(err));
          return this;
        },
      };
    },
    session: () => chainableQuery(rowsOrPromise),
  };
}

const leadRepository = {
  find(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.find(filter, options);
    return chainableQuery(findPostgresLeads(filter, options));
  },

  findOne(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.findOne(filter, options);
    return chainableQuery(findPostgresLeads(filter, { ...options, limit: 1 }).then((r) => r[0] || null));
  },

  findById(id, options = {}) {
    return this.findOne({ _id: id }, options);
  },

  countDocuments(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.countDocuments(filter, options);
    return countPostgresLeads(filter, options);
  },

  async aggregate(pipeline, options = {}) {
    if (!usePostgres(options)) return mongoRepo.aggregate(pipeline, options);

    const matchStage = pipeline.find((s) => s.$match);
    const filter = matchStage?.$match || {};
    const leads = await findPostgresLeads(filter, options);

    if (pipeline.some((s) => s.$count)) {
      return [{ total: leads.length }];
    }

    const groupStage = pipeline.find((s) => s.$group);
    if (groupStage) {
      return [{ today: 0, overdue: 0, upcoming: 0 }];
    }

    const limitStage = pipeline.find((s) => s.$limit);
    const skipStage = pipeline.find((s) => s.$skip);
    let result = leads;
    if (skipStage) result = result.slice(skipStage.$skip);
    if (limitStage) result = result.slice(0, limitStage.$limit);

    const projectStage = pipeline.find((s) => s.$project);
    if (projectStage) {
      return result.map((lead) => {
        const out = { ...lead };
        if (lead.assignedRepId) {
          out.assignedRep = {
            name: 'Rep',
            email: '',
            avatar: '',
          };
        }
        return out;
      });
    }

    return result;
  },

  async create(doc) {
    const created = await mongoRepo.create(doc);
    if (isPostgresCrmEnabled()) {
      await mirrorLeadFromMongo(created);
    }
    return created;
  },

  async findOneAndUpdate(filter, update, options = {}) {
    const updated = await mongoRepo.findOneAndUpdate(filter, update, options);
    if (updated && isPostgresCrmEnabled()) {
      await mirrorLeadFromMongo(updated);
    }
    return updated;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const updated = await mongoRepo.findByIdAndUpdate(id, update, options);
    if (updated && isPostgresCrmEnabled()) {
      await mirrorLeadFromMongo(updated);
    }
    return updated;
  },

  async deleteOne(filter, options = {}) {
    const doc = await mongoRepo.findOne(filter, options);
    if (!doc) return null;
    const result = await mongoRepo.deleteOne(filter, options);
    if (isPostgresCrmEnabled()) {
      await deleteLeadMirror(doc._id);
    }
    return result;
  },

  isPostgresCrmEnabled,
  resolveLeadMongoId,
  resolveLeadTscId,
  resolveOrganizationId,
  findPostgresLeadsPaginated: async (filter, { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = {}) => {
    const skip = (page - 1) * limit;
    const leads = await findPostgresLeads(filter, { limit, skip, sortField, sortOrder });
    const total = await countPostgresLeads(filter);
    return { leads, total };
  },
};

module.exports = leadRepository;
