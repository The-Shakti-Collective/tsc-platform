const mongoose = require('mongoose');
const Artist = require('../models/Artist');
const { getTenantId } = require('../utils/tenantContext');
const { idFilter } = require('../utils/mongoId');
const { getPrismaClient, isPostgresArtistsEnabled } = require('../infrastructure/postgres/prismaClient');
const { mirrorArtistFromMongo } = require('../infrastructure/postgres/postgresEntityWrites');
const {
  findMappingByExternalId,
  findMappingByTscId,
} = require('../infrastructure/postgres/syncMapping');

const ARTIST_ENTITY = 'Artist';
const BYPASS = { bypassTenant: true };

function parseMetadata(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw;
}

function toArtistShape(row, mongoId) {
  const meta = parseMetadata(row.metadata);
  const teamIds = Array.isArray(meta.teamUserIds) ? meta.teamUserIds : [];
  return {
    _id: mongoId,
    id: mongoId,
    name: row.name,
    slug: row.slug ?? undefined,
    bio: row.bio ?? undefined,
    profileImage: row.photoUrl ?? undefined,
    website: meta.website ?? undefined,
    socials: meta.socials ?? {},
    events: meta.legacyEvents ?? [],
    discography: meta.discography ?? [],
    team: teamIds,
    tenantId: meta.tenantId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function matchesTenant(artist, { bypass = false, tenantId } = {}) {
  if (bypass) return true;
  const tid = tenantId || getTenantId();
  if (!tid) return true;
  if (!artist.tenantId) return true;
  return String(artist.tenantId) === String(tid);
}

function pickFields(artist, select) {
  if (!select || typeof select !== 'string') return artist;
  const tokens = select.split(/\s+/).filter(Boolean);
  if (!tokens.length) return artist;

  const exclude = tokens[0].startsWith('-');
  const keys = tokens.map((t) => t.replace(/^[+-]/, ''));

  if (exclude) {
    const out = { ...artist };
    keys.forEach((key) => delete out[key]);
    return out;
  }

  const out = {};
  keys.forEach((key) => {
    if (key in artist) out[key] = artist[key];
  });
  if (keys.includes('_id') || keys.includes('id')) {
    out._id = artist._id;
    out.id = artist._id;
  }
  return out;
}

function sortArtists(artists, sort) {
  if (!sort) return artists;
  if (typeof sort === 'object' && !Array.isArray(sort)) {
    const [[field, dir]] = Object.entries(sort);
    const desc = Number(dir) === -1;
    return [...artists].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }
  const desc = String(sort).startsWith('-');
  const field = desc ? String(sort).slice(1) : String(sort);
  return [...artists].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

async function loadPostgresArtistByMongoId(mongoId, options = {}) {
  const prisma = await getPrismaClient();
  const mapping = await findMappingByExternalId(prisma, ARTIST_ENTITY, mongoId);
  if (!mapping) return null;

  const row = await prisma.artist.findUnique({ where: { id: mapping.tscEntityId } });
  if (!row) return null;

  const shaped = toArtistShape(row, mapping.externalId);
  if (!matchesTenant(shaped, options)) return null;
  return pickFields(shaped, options.select);
}

async function loadPostgresArtistByTscId(tscEntityId, options = {}) {
  const prisma = await getPrismaClient();
  const mapping = await findMappingByTscId(prisma, ARTIST_ENTITY, tscEntityId);
  if (!mapping) return null;

  const row = await prisma.artist.findUnique({ where: { id: tscEntityId } });
  if (!row) return null;

  const shaped = toArtistShape(row, mapping.externalId);
  if (!matchesTenant(shaped, options)) return null;
  return pickFields(shaped, options.select);
}

function buildPostgresNameWhere(filter) {
  if (filter.slug) {
    return { slug: String(filter.slug).trim().toLowerCase() };
  }
  if (filter.name instanceof RegExp) {
    const source = filter.name.source;
    const anchored = source.startsWith('^') && source.endsWith('$');
    const name = source.replace(/^\^|\$$/g, '');
    if (anchored) {
      return { name: { equals: name, mode: 'insensitive' } };
    }
    return { name: { contains: name, mode: 'insensitive' } };
  }
  if (typeof filter.name === 'string') {
    return { name: filter.name };
  }
  return null;
}

async function findPostgresArtists(filter = {}, options = {}) {
  const prisma = await getPrismaClient();
  const nameWhere = buildPostgresNameWhere(filter);

  let rows;
  if (nameWhere) {
    rows = await prisma.artist.findMany({ where: nameWhere });
  } else if (filter._id && typeof filter._id === 'object' && Array.isArray(filter._id.$in)) {
    const ids = filter._id.$in.map(String);
    const mappings = await Promise.all(
      ids.map((id) => findMappingByExternalId(prisma, ARTIST_ENTITY, id)),
    );
    const tscIds = mappings.filter(Boolean).map((m) => m.tscEntityId);
    rows = tscIds.length
      ? await prisma.artist.findMany({ where: { id: { in: tscIds } } })
      : [];
  } else {
    rows = await prisma.artist.findMany();
  }

  const shaped = [];
  for (const row of rows) {
    const artist = await loadPostgresArtistByTscId(row.id, options);
    if (artist) shaped.push(artist);
  }

  return sortArtists(shaped, options.sort);
}

async function findArtistById(artistId, options = {}) {
  if (!artistId) return null;

  if (isPostgresArtistsEnabled()) {
    return loadPostgresArtistByMongoId(String(artistId), options);
  }

  let query = Artist.findOne(idFilter(artistId)).setOptions(
    options.bypass ? BYPASS : {},
  );
  if (options.select) query = query.select(options.select);
  if (options.lean !== false) query = query.lean();
  return query;
}

async function findArtistOne(filter = {}, options = {}) {
  if (isPostgresArtistsEnabled()) {
    const rows = await findPostgresArtists(filter, options);
    return rows[0] ?? null;
  }

  let query = Artist.findOne(filter);
  if (options.bypass) query = query.setOptions(BYPASS);
  if (options.select) query = query.select(options.select);
  if (options.lean !== false) query = query.lean();
  return query;
}

async function findArtists(filter = {}, options = {}) {
  if (isPostgresArtistsEnabled()) {
    return findPostgresArtists(filter, options);
  }

  let query = Artist.find(filter);
  if (options.bypass) query = query.setOptions(BYPASS);
  else if (getTenantId()) query = query.setOptions({});
  if (options.select) query = query.select(options.select);
  if (options.sort) query = query.sort(options.sort);
  if (options.lean !== false) query = query.lean();
  return query;
}

async function artistExistsById(artistId, options = {}) {
  const row = await findArtistById(artistId, { ...options, select: '_id' });
  return !!row;
}

async function findArtistByIdForWrite(artistId, options = {}) {
  let query = Artist.findOne(idFilter(artistId));
  if (options.bypass) query = query.setOptions(BYPASS);
  if (options.select) query = query.select(options.select);
  return query;
}

async function createArtist(doc, options = {}) {
  const created = await Artist.create(doc);
  if (isPostgresArtistsEnabled() && options.mirrorPostgres !== false) {
    await mirrorArtistFromMongo(created);
  }
  return created;
}

async function saveArtist(mongoDoc, options = {}) {
  const saved = await mongoDoc.save();
  if (isPostgresArtistsEnabled() && options.mirrorPostgres !== false) {
    await mirrorArtistFromMongo(saved);
  }
  return saved;
}

function isValidArtistId(artistId) {
  return mongoose.Types.ObjectId.isValid(artistId);
}

module.exports = {
  findArtistById,
  findArtistOne,
  findArtists,
  artistExistsById,
  findArtistByIdForWrite,
  createArtist,
  saveArtist,
  mirrorArtistFromMongo,
  isPostgresArtistsEnabled,
  isValidArtistId,
  toArtistShape,
};
