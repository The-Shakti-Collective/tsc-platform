const Project = require('../domains/projects/models/Project');
const { createTenantRepository } = require('./createTenantRepository');
const { getPrismaClient } = require('../infrastructure/postgres/prismaClient');
const { isPostgresProjectsEnabled } = require('../infrastructure/postgres/prismaClient');
const {
  mirrorProjectFromMongo,
  deleteProjectMirror,
  upsertProjectFromMongo,
  deleteProjectMirrorSync,
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
const { mapProjectRow } = require('../infrastructure/postgres/postgresEntityMappers');
const { getTenantId } = require('../utils/tenantContext');
const { isObjectIdString } = require('../utils/mongoId');

const mongoRepo = createTenantRepository(Project);

async function resolveProjectMongoId(id) {
  if (!id) return null;
  const str = String(id);
  if (isObjectIdString(str)) return str;
  return resolveMongoId('Project', str);
}

async function resolveProjectTscId(id) {
  if (!id) return null;
  const str = String(id);
  const byMapping = await resolveTscId('Project', str);
  if (byMapping) return byMapping;
  if (!isObjectIdString(str)) return str;
  return null;
}

async function hydrateProject(row, tenantId) {
  const prisma = await getPrismaClient();
  const mongoId = await resolveMongoId('Project', row.id);
  const workspace = await prisma.workspace.findUnique({
    where: { id: row.workspaceId },
    select: { name: true, slug: true, settings: true },
  });
  const members = await prisma.projectMember.findMany({
    where: { projectId: row.id },
    select: { personId: true, role: true },
  });
  const memberShapes = await Promise.all(
    members.map(async (m) => ({
      role: m.role,
      mongoUserId: await resolveMongoUserId(m.personId),
    })),
  );
  const workspaceLabel = workspace?.name
    || row.metadata?.legacyWorkspaceLabel
    || 'GENERAL';
  return mapProjectRow(row, {
    mongoId: mongoId || row.id,
    tenantId,
    members: memberShapes,
    workspaceLabel,
  });
}

async function findPostgresProjects(filter = {}, options = {}) {
  const prisma = await getPrismaClient();
  const tenantId = options.tenantId || getTenantId();
  const where = {};

  if (filter._id || filter.id) {
    const tscId = await resolveProjectTscId(filter._id || filter.id);
    if (!tscId) return [];
    where.id = tscId;
  }

  if (filter.workspace) {
    const slug = String(filter.workspace).toLowerCase().replace(/\s+/g, '-');
    const ws = await prisma.workspace.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: String(filter.workspace), mode: 'insensitive' } },
        ],
      },
    });
    if (ws) where.workspaceId = ws.id;
    else return [];
  }

  if (filter.status) {
    const status = String(filter.status);
    where.status = status === 'active' ? { in: ['active', 'planning', 'on_hold'] } : status;
  }

  const rows = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: options.limit,
    skip: options.skip,
  });

  let shaped = await Promise.all(rows.map((row) => hydrateProject(row, tenantId)));

  if (filter.$or && tenantId) {
    const ownerOrMember = filter.$or;
    const ownerId = ownerOrMember.find((c) => c.owner)?.owner?.toString?.()
      || ownerOrMember.find((c) => c.owner)?.owner;
    const memberId = ownerOrMember.find((c) => c.members)?.members?.toString?.()
      || ownerOrMember.find((c) => c.members)?.members;
    shaped = shaped.filter((p) => {
      const pid = String(p.owner);
      return pid === String(ownerId) || (p.members || []).some((m) => String(m) === String(memberId));
    });
  }

  if (options.select) {
    const fields = String(options.select).split(/\s+/).filter(Boolean);
    if (fields.length && !fields.includes('-')) {
      shaped = shaped.map((doc) => {
        const out = {};
        for (const f of fields) out[f] = doc[f];
        return out;
      });
    }
  }

  return shaped;
}

async function findPostgresProjectById(id, options = {}) {
  const rows = await findPostgresProjects({ _id: id }, options);
  return rows[0] || null;
}

async function countPostgresProjects(filter = {}, options = {}) {
  const rows = await findPostgresProjects(filter, options);
  return rows.length;
}

function usePostgres(options = {}) {
  return isPostgresProjectsEnabled() && !options.bypass;
}

function chainableQuery(rowsOrPromise) {
  let sortSpec = null;
  let limitVal;
  let skipVal;
  const promise = () => Promise.resolve(rowsOrPromise).then((rows) => {
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

  const chain = {
    lean: () => promise(),
    select: () => chain,
    populate: () => chain,
    sort: (spec) => { sortSpec = spec; return chain; },
    skip: (n) => { skipVal = n; return chain; },
    limit: (n) => { limitVal = n; return chain; },
    session: () => chain,
  };
  return chain;
}

const projectRepository = {
  find(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.find(filter, options);
    return chainableQuery(findPostgresProjects(filter, options));
  },

  findOne(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.findOne(filter, options);
    return chainableQuery(findPostgresProjects(filter, { ...options, limit: 1 }).then((r) => r[0] || null));
  },

  findById(id, options = {}) {
    return this.findOne({ _id: id }, options);
  },

  async countDocuments(filter = {}, options = {}) {
    if (!usePostgres(options)) return mongoRepo.countDocuments(filter, options);
    return countPostgresProjects(filter, options);
  },

  async create(doc) {
    if (shouldWritePostgresFirst(isPostgresProjectsEnabled)) {
      const created = shouldMirrorMongo() ? await mongoRepo.create(doc) : asMongoDoc(doc);
      await upsertProjectFromMongo(created);
      return created;
    }
    const created = await mongoRepo.create(doc);
    if (isPostgresProjectsEnabled()) {
      await upsertProjectFromMongo(created);
    }
    return created;
  },

  async findOneAndUpdate(filter, update, options = {}) {
    if (shouldWritePostgresFirst(isPostgresProjectsEnabled)) {
      let updated;
      if (shouldMirrorMongo()) {
        updated = await mongoRepo.findOneAndUpdate(filter, update, options);
      } else {
        const existing = await this.findOne(filter, options);
        if (!existing) return null;
        updated = { ...existing, ...(update.$set || update) };
      }
      if (updated) await upsertProjectFromMongo(asMongoDoc(updated));
      return updated;
    }
    const updated = await mongoRepo.findOneAndUpdate(filter, update, options);
    if (updated && isPostgresProjectsEnabled()) {
      await upsertProjectFromMongo(updated);
    }
    return updated;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  },

  async deleteOne(filter, options = {}) {
    const doc = await mongoRepo.findOne(filter, options);
    if (!doc && !usePostgres(options)) return null;
    const target = doc || await this.findOne(filter, options);
    if (!target) return null;
    if (shouldWritePostgresFirst(isPostgresProjectsEnabled)) {
      await deleteProjectMirrorSync(target._id);
      if (shouldMirrorMongo()) {
        return mongoRepo.deleteOne(filter, options);
      }
      return { deletedCount: 1 };
    }
    const result = await mongoRepo.deleteOne(filter, options);
    if (isPostgresProjectsEnabled()) {
      await deleteProjectMirrorSync(doc._id);
    }
    return result;
  },

  aggregate(pipeline, options = {}) {
    return mongoRepo.aggregate(pipeline, options);
  },

  isPostgresProjectsEnabled,
  resolveProjectMongoId,
  resolveProjectTscId,
  resolveOrganizationId,
};

module.exports = projectRepository;
