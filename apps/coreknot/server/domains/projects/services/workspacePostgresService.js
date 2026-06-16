const { getPrismaClient, isPostgresProjectsEnabled } = require('../../../infrastructure/postgres/prismaClient');
const { resolvePersonId } = require('../../../infrastructure/postgres/syncMappingHelper');
const { workspacePreferenceRepository } = require('../../../repositories/customizationRepositories');

const DEFAULT_WORKSPACES = [
  { name: 'TSC ACADEMY', color: '#3498db' },
  { name: 'TSC ARTISTS', color: '#9b59b6' },
  { name: 'TSC FILMS', color: '#e74c3c' },
  { name: 'TSC TECH', color: '#2ecc71' },
  { name: 'GENERAL', color: '#64748b' },
];

function slugFromName(name) {
  return String(name).toLowerCase().trim().replace(/\s+/g, '-');
}

function mapWorkspaceRow(row, idx) {
  const settings = row.settings && typeof row.settings === 'object' ? row.settings : {};
  const defaultMatch = DEFAULT_WORKSPACES.find((w) => w.name === String(row.name).toUpperCase());
  return {
    _id: row.id,
    name: String(row.name).toUpperCase(),
    color: settings.color || defaultMatch?.color || '#64748b',
    order: settings.order ?? idx,
  };
}

async function ensureDefaultWorkspaces(userId) {
  const prisma = await getPrismaClient();
  const count = await prisma.workspace.count();
  if (count > 0) return;

  const personId = await resolvePersonId(String(userId));
  if (!personId) return;

  for (let idx = 0; idx < DEFAULT_WORKSPACES.length; idx += 1) {
    const workspace = DEFAULT_WORKSPACES[idx];
    const slug = slugFromName(workspace.name);
    try {
      // eslint-disable-next-line no-await-in-loop
      await prisma.workspace.create({
        data: {
          slug,
          name: workspace.name,
          ownerPersonId: personId,
          type: 'team',
          settings: { color: workspace.color, order: idx, legacyCoreKnot: true },
        },
      });
    } catch {
      /* duplicate slug — already seeded */
    }
  }
}

async function listWorkspaces(userId) {
  await ensureDefaultWorkspaces(userId);
  const prisma = await getPrismaClient();
  const rows = await prisma.workspace.findMany({ orderBy: { name: 'asc' } });
  return rows.map(mapWorkspaceRow);
}

async function findWorkspacePreferenceForUser(userId) {
  const pref = await workspacePreferenceRepository.findOne({ userId }).lean();
  return pref || null;
}

async function upsertWorkspacePreferenceOrder(userId, order) {
  const update = { order, updatedAt: new Date() };
  const existing = await workspacePreferenceRepository.findOne({ userId }).lean();
  if (existing) {
    return workspacePreferenceRepository.findOneAndUpdate({ userId }, { $set: update }, { new: true });
  }
  return workspacePreferenceRepository.create({ userId, ...update });
}

module.exports = {
  DEFAULT_WORKSPACES,
  isPostgresProjectsEnabled,
  listWorkspaces,
  findWorkspacePreferenceForUser,
  upsertWorkspacePreferenceOrder,
};
