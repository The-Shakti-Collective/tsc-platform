import type { Prisma } from '@tsc/database';
import { toInputJson } from '../../common/json';

export function applicationNotesFromMetadata(
  metadata: Prisma.JsonValue | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const notes = (metadata as Record<string, unknown>).notes;
  return typeof notes === 'string' ? notes : null;
}

export function applicationMetadataWithNotes(
  existing: Prisma.JsonValue | null | undefined,
  notes?: string | null,
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  if (notes === undefined) {
    return toInputJson(base);
  }
  return toInputJson({ ...base, notes: notes ?? null });
}

export function opportunityDescriptionFromMetadata(
  metadata: Prisma.JsonValue | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const description = (metadata as Record<string, unknown>).description;
  return typeof description === 'string' ? description : null;
}

export function opportunityArtistIdFromRow(row: {
  ownerType?: string | null;
  ownerId?: string | null;
  metadata?: Prisma.JsonValue | null;
}): string | null {
  if (row.ownerType === 'artist' && row.ownerId) {
    return row.ownerId;
  }
  if (!row.metadata || typeof row.metadata !== 'object' || Array.isArray(row.metadata)) {
    return null;
  }
  const artistId = (row.metadata as Record<string, unknown>).artistId;
  return typeof artistId === 'string' ? artistId : null;
}
