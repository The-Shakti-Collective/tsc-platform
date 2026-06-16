import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import type { TypesenseClient } from './client.js';
import {
  mapArtist,
  mapCommunityProfile,
  mapOpportunity,
  mapOrganization,
  mapProject,
} from './documents.js';
import type { SearchCollectionName } from './collections.js';
import { bootstrapCollections, recreateAllCollections } from './bootstrap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, '..');
const DEFAULT_STATE_PATH = join(PACKAGE_ROOT, '.sync-state.json');

export type SyncState = Partial<Record<SearchCollectionName, string>> & {
  lastRunAt?: string;
};

export type SyncCounts = Record<SearchCollectionName, number>;

export type SyncResult = {
  mode: 'incremental' | 'full';
  bootstrap: Array<{ collection: string; status: 'created' | 'exists' | 'recreated' }>;
  counts: SyncCounts;
  statePath: string;
};

function emptyCounts(): SyncCounts {
  return {
    artists: 0,
    opportunities: 0,
    projects: 0,
    organizations: 0,
    community_profiles: 0,
  };
}

export function readSyncState(statePath = DEFAULT_STATE_PATH): SyncState {
  if (!existsSync(statePath)) return {};
  try {
    return JSON.parse(readFileSync(statePath, 'utf8')) as SyncState;
  } catch {
    return {};
  }
}

export function writeSyncState(state: SyncState, statePath = DEFAULT_STATE_PATH): void {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function parseImportResponse(response: unknown): Array<{ success?: boolean }> {
  if (Array.isArray(response)) {
    return response as Array<{ success?: boolean }>;
  }

  const text = String(response).trim();
  if (!text) return [];

  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { success?: boolean });
}

async function importDocuments(
  client: TypesenseClient,
  collection: SearchCollectionName,
  documents: Record<string, unknown>[],
): Promise<number> {
  if (documents.length === 0) return 0;

  const batchSize = 100;
  let imported = 0;

  for (let offset = 0; offset < documents.length; offset += batchSize) {
    const batch = documents.slice(offset, offset + batchSize);
    const response = await client
      .collections(collection)
      .documents()
      .import(batch, { action: 'upsert' });

    for (const parsed of parseImportResponse(response)) {
      if (parsed.success) imported += 1;
    }
  }

  return imported;
}

function sinceDate(state: SyncState, collection: SearchCollectionName): Date | undefined {
  const raw = state[collection];
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function maxUpdatedAt<T extends { updatedAt: Date }>(rows: T[]): Date | undefined {
  if (rows.length === 0) return undefined;
  return rows.reduce(
    (max, row) => (row.updatedAt > max ? row.updatedAt : max),
    rows[0].updatedAt,
  );
}

async function syncArtists(
  prisma: PrismaClient,
  client: TypesenseClient,
  since?: Date,
): Promise<{ count: number; watermark?: Date }> {
  const rows = await prisma.artist.findMany({
    where: since ? { updatedAt: { gt: since } } : undefined,
    orderBy: { updatedAt: 'asc' },
  });
  const count = await importDocuments(
    client,
    'artists',
    rows.map((row) => mapArtist(row)),
  );
  return { count, watermark: maxUpdatedAt(rows) };
}

async function syncOpportunities(
  prisma: PrismaClient,
  client: TypesenseClient,
  since?: Date,
): Promise<{ count: number; watermark?: Date }> {
  const rows = await prisma.opportunity.findMany({
    where: since ? { updatedAt: { gt: since } } : undefined,
    orderBy: { updatedAt: 'asc' },
  });
  const count = await importDocuments(
    client,
    'opportunities',
    rows.map((row) => mapOpportunity(row)),
  );
  return { count, watermark: maxUpdatedAt(rows) };
}

async function syncProjects(
  prisma: PrismaClient,
  client: TypesenseClient,
  since?: Date,
): Promise<{ count: number; watermark?: Date }> {
  const rows = await prisma.project.findMany({
    where: since ? { updatedAt: { gt: since } } : undefined,
    orderBy: { updatedAt: 'asc' },
  });
  const count = await importDocuments(
    client,
    'projects',
    rows.map((row) => mapProject(row)),
  );
  return { count, watermark: maxUpdatedAt(rows) };
}

async function syncOrganizations(
  prisma: PrismaClient,
  client: TypesenseClient,
  since?: Date,
): Promise<{ count: number; watermark?: Date }> {
  const rows = await prisma.organization.findMany({
    where: since ? { updatedAt: { gt: since } } : undefined,
    orderBy: { updatedAt: 'asc' },
  });
  const count = await importDocuments(
    client,
    'organizations',
    rows.map((row) => mapOrganization(row)),
  );
  return { count, watermark: maxUpdatedAt(rows) };
}

async function syncCommunityProfiles(
  prisma: PrismaClient,
  client: TypesenseClient,
  since?: Date,
): Promise<{ count: number; watermark?: Date }> {
  const rows = await prisma.community.findMany({
    where: since ? { updatedAt: { gt: since } } : undefined,
    orderBy: { updatedAt: 'asc' },
  });
  const count = await importDocuments(
    client,
    'community_profiles',
    rows.map((row) => mapCommunityProfile(row)),
  );
  return { count, watermark: maxUpdatedAt(rows) };
}

function applyWatermark(
  state: SyncState,
  collection: SearchCollectionName,
  watermark?: Date,
  previous?: string,
): void {
  if (watermark) {
    state[collection] = watermark.toISOString();
    return;
  }
  if (previous) state[collection] = previous;
}

export async function runIncrementalSync(options: {
  client: TypesenseClient;
  prisma: PrismaClient;
  statePath?: string;
}): Promise<SyncResult> {
  const statePath = options.statePath ?? DEFAULT_STATE_PATH;
  const previousState = readSyncState(statePath);
  const bootstrap = await bootstrapCollections(options.client);
  const counts = emptyCounts();
  const nextState: SyncState = { ...previousState };

  const syncers = [
    ['artists', syncArtists] as const,
    ['opportunities', syncOpportunities] as const,
    ['projects', syncProjects] as const,
    ['organizations', syncOrganizations] as const,
    ['community_profiles', syncCommunityProfiles] as const,
  ];

  for (const [collection, syncer] of syncers) {
    const since = sinceDate(previousState, collection);
    const result = await syncer(options.prisma, options.client, since);
    counts[collection] = result.count;
    applyWatermark(nextState, collection, result.watermark, previousState[collection]);
  }

  nextState.lastRunAt = new Date().toISOString();
  writeSyncState(nextState, statePath);

  return {
    mode: 'incremental',
    bootstrap,
    counts,
    statePath,
  };
}

export async function runFullReindex(options: {
  client: TypesenseClient;
  prisma: PrismaClient;
  statePath?: string;
}): Promise<SyncResult> {
  const statePath = options.statePath ?? DEFAULT_STATE_PATH;
  const bootstrap = await recreateAllCollections(options.client);
  const counts = emptyCounts();
  const nextState: SyncState = {};

  const syncers = [
    ['artists', syncArtists] as const,
    ['opportunities', syncOpportunities] as const,
    ['projects', syncProjects] as const,
    ['organizations', syncOrganizations] as const,
    ['community_profiles', syncCommunityProfiles] as const,
  ];

  for (const [collection, syncer] of syncers) {
    const result = await syncer(options.prisma, options.client);
    counts[collection] = result.count;
    applyWatermark(nextState, collection, result.watermark);
  }

  nextState.lastRunAt = new Date().toISOString();
  writeSyncState(nextState, statePath);

  return {
    mode: 'full',
    bootstrap,
    counts,
    statePath,
  };
}
