import type { Prisma } from '@prisma/client';

export const SYNC_SOURCE_SYSTEMS = ['coreknot', 'tsc'] as const;
export type SyncSourceSystemValue = (typeof SYNC_SOURCE_SYSTEMS)[number];

export const syncMappingInclude = {} as const;

export function syncMappingUniqueWhere(input: {
  sourceSystem: SyncSourceSystemValue;
  externalId: string;
  tscEntityType: string;
}): Prisma.SyncMappingWhereUniqueInput {
  return {
    sourceSystem_externalId_tscEntityType: {
      sourceSystem: input.sourceSystem,
      externalId: input.externalId,
      tscEntityType: input.tscEntityType,
    },
  };
}

export function syncEventReceiptUniqueWhere(input: {
  sourceSystem: SyncSourceSystemValue;
  externalId: string;
}): Prisma.SyncEventReceiptWhereUniqueInput {
  return {
    sourceSystem_externalId: {
      sourceSystem: input.sourceSystem,
      externalId: input.externalId,
    },
  };
}

export function resolveTscEntityId(
  mappings: Array<{ tscEntityType: string; tscEntityId: string }>,
  entityType: string,
): string | null {
  const row = mappings.find((m) => m.tscEntityType === entityType);
  return row?.tscEntityId ?? null;
}

export function slugifyArtistName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
