import type { Relationship } from '@tsc/database';
import type { RelationshipRecord } from '@tsc/types';

export type RelationshipDto = RelationshipRecord;

export function toRelationshipDto(row: Relationship): RelationshipDto {
  return {
    id: row.id,
    sourceEntityType: row.sourceEntityType,
    sourceEntityId: row.sourceEntityId,
    targetEntityType: row.targetEntityType,
    targetEntityId: row.targetEntityId,
    relationshipType: row.relationshipType,
    strength: row.strength,
    weight: row.weight,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    effectiveFrom: row.effectiveFrom?.toISOString() ?? null,
    effectiveTo: row.effectiveTo?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
