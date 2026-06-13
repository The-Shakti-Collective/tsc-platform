import { Injectable } from '@nestjs/common';
import type { GraphEntityType, Prisma, Relationship } from '@tsc/database';
import {
  buildRelationshipListWhere,
  findPathsInMemory,
  toRelationshipCreateInput,
  whereActiveAt,
  whereEntityTouches,
} from '@tsc/database';
import type {
  RelationshipCreateData,
  RelationshipUpdateData,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type {
  RelationshipGraphQuery,
  RelationshipListQuery,
} from './dto';

@Injectable()
export class RelationshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  listRelationships(query: RelationshipListQuery) {
    const where = buildRelationshipListWhere({
      entityType: query.entityType,
      entityId: query.entityId,
      relationshipType: query.relationshipType,
      activeOnly: !query.includeInactive,
    });

    return this.prisma.client.relationship.findMany({
      where,
      take: query.limit,
      orderBy: { updatedAt: 'desc' },
    });
  }

  findRelationship(id: string) {
    return this.prisma.client.relationship.findUnique({
      where: { id },
    });
  }

  createRelationship(data: RelationshipCreateData) {
    return this.prisma.client.relationship.create({
      data: {
        id: newId(),
        ...toRelationshipCreateInput(data),
      },
    });
  }

  updateRelationship(id: string, data: RelationshipUpdateData) {
    return this.prisma.client.relationship.update({
      where: { id },
      data: {
        relationshipType: data.relationshipType,
        strength: data.strength,
        weight: data.weight,
        metadata:
          data.metadata !== undefined ? toInputJson(data.metadata) : undefined,
        effectiveFrom:
          data.effectiveFrom !== undefined ? data.effectiveFrom : undefined,
        effectiveTo:
          data.effectiveTo !== undefined ? data.effectiveTo : undefined,
      },
    });
  }

  deleteRelationship(id: string) {
    return this.prisma.client.relationship.delete({ where: { id } });
  }

  async listNeighbors(
    entityType: GraphEntityType,
    entityId: string,
    query: RelationshipGraphQuery,
  ): Promise<Relationship[]> {
    const where: Prisma.RelationshipWhereInput = {
      AND: [
        whereEntityTouches(entityType, entityId),
        ...(query.relationshipType
          ? [{ relationshipType: query.relationshipType }]
          : []),
        ...(query.includeInactive ? [] : [whereActiveAt()]),
      ],
    };

    return this.prisma.client.relationship.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listSubgraphRelationships(
    entityType: GraphEntityType,
    entityId: string,
    query: RelationshipGraphQuery,
  ): Promise<Relationship[]> {
    const depth = query.depth ?? 1;
    if (depth <= 1) {
      return this.listNeighbors(entityType, entityId, query);
    }

    const seenEdgeIds = new Set<string>();
    const collected: Relationship[] = [];
    const frontier = new Set<string>([`${entityType}:${entityId}`]);
    const visited = new Set<string>(frontier);

    for (let level = 0; level < depth; level += 1) {
      const nextFrontier = new Set<string>();

      for (const key of frontier) {
        const [type, id] = key.split(':') as [GraphEntityType, string];
        const rows = await this.listNeighbors(type, id, query);

        for (const row of rows) {
          if (seenEdgeIds.has(row.id)) continue;
          seenEdgeIds.add(row.id);
          collected.push(row);

          for (const peerKey of [
            `${row.sourceEntityType}:${row.sourceEntityId}`,
            `${row.targetEntityType}:${row.targetEntityId}`,
          ]) {
            if (!visited.has(peerKey)) {
              visited.add(peerKey);
              nextFrontier.add(peerKey);
            }
          }
        }
      }

      frontier.clear();
      for (const key of nextFrontier) frontier.add(key);
      if (frontier.size === 0) break;
    }

    return collected;
  }

  findPaths(
    anchorType: GraphEntityType,
    anchorId: string,
    targetType: GraphEntityType,
    targetId: string,
    maxDepth: number,
    includeInactive: boolean,
  ) {
    const where: Prisma.RelationshipWhereInput = includeInactive
      ? {}
      : whereActiveAt();

    return this.prisma.client.relationship
      .findMany({ where })
      .then((rows) =>
        findPathsInMemory(anchorType, anchorId, rows, targetType, targetId, maxDepth),
      );
  }
}
