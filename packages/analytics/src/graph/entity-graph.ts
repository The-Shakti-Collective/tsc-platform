import type { GraphEntityType, EntityGraphSummary } from '@tsc/types';

export type { EntityGraphSummary };

export interface GraphEdge {
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  relationshipType: string;
  strength?: number | null;
}

export function summarizeEntityGraph(
  edges: GraphEdge[],
  entityType: GraphEntityType,
  entityId: string,
): EntityGraphSummary {
  const relationshipCounts: Record<string, number> = {};
  const nodeIds = new Set<string>();

  for (const edge of edges) {
    relationshipCounts[edge.relationshipType] = (relationshipCounts[edge.relationshipType] ?? 0) + 1;
    nodeIds.add(`${edge.sourceEntityType}:${edge.sourceEntityId}`);
    nodeIds.add(`${edge.targetEntityType}:${edge.targetEntityId}`);
  }

  const topConnections = edges
    .slice(0, 12)
    .map((edge) => {
      const isSource = edge.sourceEntityId === entityId && edge.sourceEntityType === entityType;
      return {
        entityType: isSource ? edge.targetEntityType : edge.sourceEntityType,
        entityId: isSource ? edge.targetEntityId : edge.sourceEntityId,
        relationshipType: edge.relationshipType,
        strength: edge.strength ?? null,
      };
    });

  return {
    entityType,
    entityId,
    nodeCount: nodeIds.size,
    edgeCount: edges.length,
    relationshipCounts,
    topConnections,
  };
}

export type { CityIntelligenceMetrics } from '../industry/types.js';
