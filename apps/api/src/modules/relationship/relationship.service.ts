import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RELATIONSHIP_TYPES,
  buildEntitySubgraph,
  type GraphEntityType,
} from '@tsc/database';
import { canManageArtist, type MembershipContext } from '@tsc/permissions';
import type { EntitySubgraphResponse } from '@tsc/types';
import type {
  RelationshipCreateInput,
  RelationshipGraphQuery,
  RelationshipListQuery,
  RelationshipUpdateInput,
} from './dto';
import { RelationshipRepository } from './relationship.repository';
import { toRelationshipDto, type RelationshipDto } from './types';

@Injectable()
export class RelationshipService {
  constructor(private readonly relationshipRepository: RelationshipRepository) {}

  listRelationshipTypes(): { types: readonly string[] } {
    return { types: RELATIONSHIP_TYPES };
  }

  async listRelationships(query: RelationshipListQuery): Promise<RelationshipDto[]> {
    const rows = await this.relationshipRepository.listRelationships(query);
    return rows.map(toRelationshipDto);
  }

  async getRelationship(id: string): Promise<RelationshipDto> {
    const row = await this.relationshipRepository.findRelationship(id);
    if (!row) throw new NotFoundException(`Relationship ${id} not found`);
    return toRelationshipDto(row);
  }

  async createRelationship(input: RelationshipCreateInput): Promise<RelationshipDto> {
    const row = await this.relationshipRepository.createRelationship({
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      relationshipType: input.relationshipType,
      strength: input.strength ?? null,
      weight: input.weight ?? input.strength ?? null,
      metadata: input.metadata,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
    });
    return toRelationshipDto(row);
  }

  async updateRelationship(
    id: string,
    input: RelationshipUpdateInput,
  ): Promise<RelationshipDto> {
    await this.getRelationship(id);
    const row = await this.relationshipRepository.updateRelationship(id, {
      relationshipType: input.relationshipType,
      strength: input.strength,
      weight: input.weight,
      metadata: input.metadata,
      effectiveFrom:
        input.effectiveFrom !== undefined
          ? input.effectiveFrom
            ? new Date(input.effectiveFrom)
            : null
          : undefined,
      effectiveTo:
        input.effectiveTo !== undefined
          ? input.effectiveTo
            ? new Date(input.effectiveTo)
            : null
          : undefined,
    });
    return toRelationshipDto(row);
  }

  async deleteRelationship(id: string): Promise<{ success: true }> {
    await this.getRelationship(id);
    await this.relationshipRepository.deleteRelationship(id);
    return { success: true };
  }

  /** Graph query: connected nodes grouped by relationship type for Network View. */
  async getEntitySubgraph(
    entityType: GraphEntityType,
    entityId: string,
    query: RelationshipGraphQuery,
    ctx: MembershipContext,
  ): Promise<EntitySubgraphResponse> {
    this.assertGraphAccess(ctx, entityType, entityId);

    const rows = await this.relationshipRepository.listSubgraphRelationships(
      entityType,
      entityId,
      query,
    );
    const subgraph = buildEntitySubgraph(entityType, entityId, rows);

    return {
      ...subgraph,
      updatedAt: new Date().toISOString(),
    };
  }

  private assertGraphAccess(
    ctx: MembershipContext,
    entityType: GraphEntityType,
    entityId: string,
  ): void {
    if (ctx.roles.includes('admin')) return;
    if (entityType === 'Artist' && canManageArtist(ctx, entityId)) return;
    if (entityType === 'Person' && ctx.userId === entityId) return;
    throw new ForbiddenException('Cannot view relationship graph for this entity');
  }
}
