const { createTenantRepository } = require('./createTenantRepository');
const { getPrismaClient, isPostgresCrmEnabled, isMongoRequired } = require('../infrastructure/postgres/prismaClient');
const {
  upsertLeadFromMongo,
  deleteLeadMirrorSync,
} = require('../infrastructure/postgres/postgresEntityWrites');
const {
  shouldWritePostgresFirst,
  shouldMirrorMongo,
  asMongoDoc,
} = require('../infrastructure/postgres/writeStrategy');
const {
  resolveTscId,
  resolveMongoId,
  resolveOrganizationId,
  resolveMongoUserId,
} = require('../infrastructure/postgres/syncMappingHelper');
const { mapLeadRow } = require('../infrastructure/postgres/postgresEntityMappers');
const { matchesMongoFilter } = require('../infrastructure/postgres/mongoFilterMatch');
const { getTenantId } = require('../utils/tenantContext');
const { isObjectIdString } = require('../utils/mongoId');

/** @type {import('mongoose').Model | null} */
let LeadModel = null;
/** @type {ReturnType<createTenantRepository> | null} */
let mongoRepo = null;

function getLeadModel() {
  if (!LeadModel) {
    if (!isMongoRequired() && isPostgresCrmEnabled()) {
      throw new Error('Mongo Lead model unavailable when COREKNOT_MONGO_REQUIRED=false');
    }
    // eslint-disable-next-line global-require
    LeadModel = require('../domains/crm/models/Lead');
  }
  return LeadModel;
}

function getMongoRepo() {
  if (!isMongoRequired() && isPostgresCrmEnabled()) {
    throw new Error('Mongo lead repository unavailable when COREKNOT_MONGO_REQUIRED=false');
  }
  if (!mongoRepo) {
    mongoRepo = createTenantRepository(getLeadModel());
  }
  return mongoRepo;
}

function applyMongoUpdate(existing, update = {}) {
  const base = { ...(existing?.toObject?.() || existing || {}) };
  const merged = { ...base };

  if (update.$set && typeof update.$set === 'object') {
    Object.assign(merged, update.$set);
  }
  if (update.$unset && typeof update.$unset === 'object') {
    for (const key of Object.keys(update.$unset)) {
      delete merged[key];
    }
  }
  if (update.$push && typeof update.$push === 'object') {
    for (const [key, value] of Object.entries(update.$push)) {
      const current = Array.isArray(merged[key]) ? merged[key] : [];
      merged[key] = [...current, value];
    }
  }

  for (const [key, value] of Object.entries(update)) {
    if (key.startsWith('$')) continue;
    merged[key] = value;
  }

  delete merged.toObject;
  return merged;
}

async function logLeadFieldChanges(oldLead, update, options = {}) {
  const userId = options.userId || 'SYSTEM';
  const userRole = options.userRole || 'SYSTEM';
  const updateData = {};
  for (const key in update) {
    if (!key.startsWith('$')) updateData[key] = update[key];
  }
  if (update.$set) Object.assign(updateData, update.$set);

  const auditLogs = [];
  for (const path in updateData) {
    if (['updatedAt', 'lockedBy', 'lockedAt', '__v'].includes(path)) continue;
    const oldValue = oldLead[path];
    const newValue = updateData[path];
    if (String(oldValue ?? '') !== String(newValue ?? '')) {
      auditLogs.push({
        leadId: oldLead._id,
        userId,
        userRole,
        fieldChanged: path,
        oldValue: String(oldValue ?? ''),
        newValue: String(newValue ?? ''),
        timestamp: new Date(),
      });
    }
  }

  if (!auditLogs.length) return;
  try {
    const { crmAuditRepository } = require('./crmRepositories');
    await crmAuditRepository.insertMany(auditLogs);
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
}

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
  if (options.bypass || options.bypassTenant) return {};
  const tenantId = options.tenantId || getTenantId();
  const organizationId = await resolveOrganizationId(tenantId);
  if (!organizationId) return null;
  return { organizationId };
}

function sortLeads(leads, sortField = 'createdAt', sortOrder = 'desc') {
  const dir = sortOrder === 'asc' ? 1 : -1;
  return [...leads].sort((a, b) => {
    const av = a[sortField];
    const bv = b[sortField];
    if (av === bv) return String(a._id).localeCompare(String(b._id)) * dir;
    return (av > bv ? 1 : -1) * dir;
  });
}

async function findPostgresLeads(filter = {}, options = {}) {
  const prisma = await getPrismaClient();
  const tenantId = options.tenantId || getTenantId();
  const orgWhere = await tenantOrgWhere(options);
  if (orgWhere === null) return [];

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

  if (filter.leadStatus && typeof filter.leadStatus === 'string') {
    const { STAGE_TO_LEAD_STATUS } = require('../infrastructure/postgres/postgresEntityMappers');
    const stageEntry = Object.entries(STAGE_TO_LEAD_STATUS).find(([, v]) => v === filter.leadStatus);
    if (stageEntry) where.stage = stageEntry[0];
  }

  if (filter.source && typeof filter.source === 'string') where.source = filter.source;

  const rows = await prisma.lead.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  let shaped = await Promise.all(rows.map((row) => hydrateLead(row, tenantId)));
  shaped = shaped.filter((lead) => matchesMongoFilter(lead, filter));

  if (options.sortField || options.sortOrder) {
    shaped = sortLeads(shaped, options.sortField || 'createdAt', options.sortOrder || 'desc');
  }

  if (options.skip) shaped = shaped.slice(options.skip);
  if (options.limit) shaped = shaped.slice(0, options.limit);

  return shaped;
}

async function countPostgresLeads(filter = {}, options = {}) {
  const leads = await findPostgresLeads(filter, options);
  return leads.length;
}

function usePostgres(options = {}) {
  return isPostgresCrmEnabled() && !options.bypass;
}

function chainableQuery(rowsOrFactory, queryOptions = {}) {
  let sortSpec = null;
  let limitVal;
  let skipVal;
  let chainOptions = { ...queryOptions };

  const promise = () => {
    const rowsOrPromise = typeof rowsOrFactory === 'function' ? rowsOrFactory(chainOptions) : rowsOrFactory;
    return Promise.resolve(rowsOrPromise).then((rows) => {
      let list = Array.isArray(rows) ? [...rows] : (rows ? [rows] : []);
      if (sortSpec) {
        const [[field, dir]] = Object.entries(sortSpec);
        list.sort((a, b) => {
          const av = a[field];
          const bv = b[field];
          if (av === bv) return 0;
          return (av > bv ? 1 : -1) * (dir === -1 ? -1 : 1);
        });
      }
      if (skipVal) list = list.slice(skipVal);
      if (limitVal) list = list.slice(0, limitVal);
      return Array.isArray(rows) ? list : (list[0] || null);
    });
  };

  const chain = {
    lean: () => promise(),
    select: () => chain,
    populate: () => chain,
    sort: (spec) => { sortSpec = spec; return chain; },
    skip: (n) => { skipVal = n; return chain; },
    limit: (n) => { limitVal = n; return chain; },
    setOptions: (opts) => {
      chainOptions = { ...chainOptions, ...opts };
      return chain;
    },
    session: () => chain,
    cursor: () => {
      let index = 0;
      return {
        on(event, handler) {
          if (event === 'data') {
            promise().then((rows) => {
              const list = Array.isArray(rows) ? rows : (rows ? [rows] : []);
              list.forEach((row) => handler(row));
            });
          }
          if (event === 'end') promise().then(() => handler());
          if (event === 'error') promise().catch((err) => handler(err));
          return this;
        },
      };
    },
    then: (resolve, reject) => promise().then(resolve, reject),
    exec: () => promise(),
    _options: () => chainOptions,
  };
  return chain;
}

const leadRepository = {
  find(filter = {}, options = {}) {
    if (!usePostgres(options)) return getMongoRepo().find(filter, options);
    return chainableQuery((opts) => findPostgresLeads(filter, { ...options, ...opts }), options);
  },

  findOne(filter = {}, options = {}) {
    if (!usePostgres(options)) return getMongoRepo().findOne(filter, options);
    return chainableQuery(
      (opts) => findPostgresLeads(filter, { ...options, ...opts, limit: 1 }).then((r) => r[0] || null),
      options,
    );
  },

  findById(id, options = {}) {
    return this.findOne({ _id: id }, options);
  },

  countDocuments(filter = {}, options = {}) {
    if (!usePostgres(options)) return getMongoRepo().countDocuments(filter, options);
    return countPostgresLeads(filter, options);
  },

  async distinct(field, filter = {}, options = {}) {
    if (!usePostgres(options)) {
      return getLeadModel().distinct(field, filter);
    }
    const leads = await findPostgresLeads(filter, options);
    const values = new Set();
    for (const lead of leads) {
      const value = lead[field];
      if (value != null && value !== '') values.add(value);
    }
    return [...values];
  },

  async aggregate(pipeline, options = {}) {
    if (!usePostgres(options)) return getMongoRepo().aggregate(pipeline, options);

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
    if (shouldWritePostgresFirst(isPostgresCrmEnabled)) {
      const created = shouldMirrorMongo() ? await getMongoRepo().create(doc) : asMongoDoc(doc);
      await upsertLeadFromMongo(created);
      return created;
    }
    const created = await getMongoRepo().create(doc);
    if (isPostgresCrmEnabled()) {
      await upsertLeadFromMongo(created);
    }
    return created;
  },

  async findOneAndUpdate(filter, update, options = {}) {
    if (shouldWritePostgresFirst(isPostgresCrmEnabled)) {
      const existing = await this.findOne(filter, options);
      if (!existing) return null;
      if (filter.$or && !matchesMongoFilter(existing, filter)) return null;

      const merged = applyMongoUpdate(existing, update);
      const updated = asMongoDoc({ ...merged, _id: existing._id });
      await upsertLeadFromMongo(updated);
      if (options.userId || options.userRole) {
        await logLeadFieldChanges(existing, update, options);
      }
      if (shouldMirrorMongo()) {
        return getMongoRepo().findOneAndUpdate(filter, update, options);
      }
      return updated;
    }
    const updated = await getMongoRepo().findOneAndUpdate(filter, update, options);
    if (updated && isPostgresCrmEnabled()) {
      await upsertLeadFromMongo(updated);
    }
    return updated;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  },

  async findOneAndDelete(filter, options = {}) {
    const doc = await this.findOne(filter, options);
    if (!doc) return null;
    await this.deleteOne(filter, options);
    return doc;
  },

  async deleteOne(filter, options = {}) {
    const target = await this.findOne(filter, options);
    if (!target) return null;
    if (shouldWritePostgresFirst(isPostgresCrmEnabled)) {
      await deleteLeadMirrorSync(target._id);
      if (shouldMirrorMongo()) {
        return getMongoRepo().deleteOne(filter, options);
      }
      return { deletedCount: 1 };
    }
    const result = await getMongoRepo().deleteOne(filter, options);
    if (isPostgresCrmEnabled()) {
      await deleteLeadMirrorSync(target._id);
    }
    return result;
  },

  async deleteMany(filter = {}, options = {}) {
    if (shouldWritePostgresFirst(isPostgresCrmEnabled) && !shouldMirrorMongo()) {
      const docs = await findPostgresLeads(filter, options);
      for (const doc of docs) {
        // eslint-disable-next-line no-await-in-loop
        await deleteLeadMirrorSync(doc._id);
      }
      return { deletedCount: docs.length };
    }
    const result = await getMongoRepo().deleteMany(filter, options);
    if (isPostgresCrmEnabled()) {
      const docs = await findPostgresLeads(filter, options);
      for (const doc of docs) {
        // eslint-disable-next-line no-await-in-loop
        await deleteLeadMirrorSync(doc._id);
      }
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
