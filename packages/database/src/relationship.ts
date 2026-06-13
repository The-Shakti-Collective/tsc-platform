/** Relationship graph engine — CRUD helpers, traversal, subgraph (Phase 6). */

import type {
  GraphEntityType,
  Prisma,
  Relationship,
  RelationshipType,
} from "@prisma/client";

export type { GraphEntityType, Relationship, RelationshipType };

export const GRAPH_ENTITY_TYPES = [
  "Artist",
  "Venue",
  "Curator",
  "Brand",
  "Agency",
  "Label",
  "Organization",
  "Person",
  "Festival",
  "Event",
  "Community",
  "Membership",
  "CreativeIdentity",
  "Skill",
] as const satisfies readonly GraphEntityType[];

export const RELATIONSHIP_TYPES = [
  "MANAGES",
  "COLLABORATED_WITH",
  "ATTENDED",
  "MEMBER_OF",
  "PERFORMED_AT",
  "BOOKED_BY",
  "FOLLOWS",
  "MENTORED_BY",
  "SPONSORED_BY",
  "WORKED_WITH",
  "REFERRED_BY",
  "SIGNED_TO",
  "SUPPORTED",
  "SUBSCRIBED",
  "PURCHASED",
  "REFERRED",
  "HAS_SKILL",
] as const satisfies readonly RelationshipType[];

/** Legacy Phase 4 snake_case values mapped to Phase 6 enum. */
export const LEGACY_RELATIONSHIP_TYPE_MAP: Record<string, RelationshipType> = {
  performed_at: "PERFORMED_AT",
  booked: "BOOKED_BY",
  worked_with: "WORKED_WITH",
  collaborated_with: "COLLABORATED_WITH",
  managed_by: "MANAGES",
  sponsored_by: "SPONSORED_BY",
  organized_by: "MANAGES",
  hosted_at: "PERFORMED_AT",
  represented_by: "MANAGES",
  affiliated_with: "MEMBER_OF",
  produced_by: "WORKED_WITH",
  featured_at: "PERFORMED_AT",
  follows: "FOLLOWS",
  attended: "ATTENDED",
  member_of: "MEMBER_OF",
  mentored_by: "MENTORED_BY",
  referred_by: "REFERRED_BY",
  signed_to: "SIGNED_TO",
  supported: "SUPPORTED",
  subscribed: "SUBSCRIBED",
  purchased: "PURCHASED",
  referred: "REFERRED",
};

export interface EcosystemGraphEdge {
  id: string;
  relationshipType: RelationshipType;
  direction: "outbound" | "inbound";
  sourceEntityType: GraphEntityType;
  sourceEntityId: string;
  targetEntityType: GraphEntityType;
  targetEntityId: string;
  strength: number | null;
  weight: number | null;
  metadata: Record<string, unknown>;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface GraphNodeRef {
  entityType: GraphEntityType;
  entityId: string;
}

export interface ConnectedNode extends GraphNodeRef {
  direction: "outbound" | "inbound";
  relationshipId: string;
  strength: number | null;
  weight: number | null;
  metadata: Record<string, unknown>;
}

export interface EntitySubgraph {
  entityType: GraphEntityType;
  entityId: string;
  nodes: GraphNodeRef[];
  edges: EcosystemGraphEdge[];
  byRelationshipType: Partial<
    Record<
      RelationshipType,
      { outbound: ConnectedNode[]; inbound: ConnectedNode[] }
    >
  >;
  stats: {
    edgeCount: number;
    nodeCount: number;
    neighborCount: number;
  };
}

export interface GraphPathResult {
  found: boolean;
  maxDepth: number;
  paths: Array<{
    nodes: GraphNodeRef[];
    edges: EcosystemGraphEdge[];
  }>;
}

export const relationshipInclude = {} as const;

export function normalizeRelationshipType(value: string): RelationshipType {
  const upper = value.toUpperCase() as RelationshipType;
  if ((RELATIONSHIP_TYPES as readonly string[]).includes(upper)) {
    return upper;
  }
  const legacy = LEGACY_RELATIONSHIP_TYPE_MAP[value.toLowerCase()];
  if (legacy) return legacy;
  throw new Error(`Unknown relationship type: ${value}`);
}

export function parseRelationshipMetadata(
  value: Prisma.JsonValue,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function whereEntityTouches(
  entityType: GraphEntityType,
  entityId: string,
): Prisma.RelationshipWhereInput {
  return {
    OR: [
      { sourceEntityType: entityType, sourceEntityId: entityId },
      { targetEntityType: entityType, targetEntityId: entityId },
    ],
  };
}

export function whereActiveAt(at: Date = new Date()): Prisma.RelationshipWhereInput {
  return {
    AND: [
      { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: at } }] },
      { OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] },
    ],
  };
}

export function buildRelationshipListWhere(input: {
  entityType?: GraphEntityType;
  entityId?: string;
  relationshipType?: RelationshipType;
  activeOnly?: boolean;
  at?: Date;
}): Prisma.RelationshipWhereInput {
  const clauses: Prisma.RelationshipWhereInput[] = [];

  if (input.entityType && input.entityId) {
    clauses.push(whereEntityTouches(input.entityType, input.entityId));
  }
  if (input.relationshipType) {
    clauses.push({ relationshipType: input.relationshipType });
  }
  if (input.activeOnly !== false) {
    clauses.push(whereActiveAt(input.at));
  }

  return clauses.length > 0 ? { AND: clauses } : {};
}

export function toEcosystemGraphEdge(
  relationship: Relationship,
  anchorType: GraphEntityType,
  anchorId: string,
): EcosystemGraphEdge {
  const isSource =
    relationship.sourceEntityType === anchorType &&
    relationship.sourceEntityId === anchorId;

  return {
    id: relationship.id,
    relationshipType: relationship.relationshipType,
    direction: isSource ? "outbound" : "inbound",
    sourceEntityType: relationship.sourceEntityType,
    sourceEntityId: relationship.sourceEntityId,
    targetEntityType: relationship.targetEntityType,
    targetEntityId: relationship.targetEntityId,
    strength: relationship.strength,
    weight: relationship.weight,
    metadata: parseRelationshipMetadata(relationship.metadata),
    effectiveFrom: relationship.effectiveFrom?.toISOString() ?? null,
    effectiveTo: relationship.effectiveTo?.toISOString() ?? null,
  };
}

export function neighborNodeFromEdge(
  edge: EcosystemGraphEdge,
): ConnectedNode {
  const peer =
    edge.direction === "outbound"
      ? {
          entityType: edge.targetEntityType,
          entityId: edge.targetEntityId,
        }
      : {
          entityType: edge.sourceEntityType,
          entityId: edge.sourceEntityId,
        };

  return {
    ...peer,
    direction: edge.direction,
    relationshipId: edge.id,
    strength: edge.strength,
    weight: edge.weight,
    metadata: edge.metadata,
  };
}

export function groupConnectedByRelationshipType(
  edges: EcosystemGraphEdge[],
): EntitySubgraph["byRelationshipType"] {
  const grouped: EntitySubgraph["byRelationshipType"] = {};

  for (const edge of edges) {
    const bucket =
      grouped[edge.relationshipType] ??
      (grouped[edge.relationshipType] = { outbound: [], inbound: [] });
    const node = neighborNodeFromEdge(edge);
    if (edge.direction === "outbound") {
      bucket.outbound.push(node);
    } else {
      bucket.inbound.push(node);
    }
  }

  return grouped;
}

export function collectGraphNodes(
  entityType: GraphEntityType,
  entityId: string,
  edges: EcosystemGraphEdge[],
): GraphNodeRef[] {
  const seen = new Set<string>();
  const nodes: GraphNodeRef[] = [];

  const add = (type: GraphEntityType, id: string) => {
    const key = `${type}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    nodes.push({ entityType: type, entityId: id });
  };

  add(entityType, entityId);
  for (const edge of edges) {
    add(edge.sourceEntityType, edge.sourceEntityId);
    add(edge.targetEntityType, edge.targetEntityId);
  }

  return nodes;
}

export function buildEntitySubgraph(
  entityType: GraphEntityType,
  entityId: string,
  relationships: Relationship[],
): EntitySubgraph {
  const edges = relationships.map((row) =>
    toEcosystemGraphEdge(row, entityType, entityId),
  );
  const nodes = collectGraphNodes(entityType, entityId, edges);
  const byRelationshipType = groupConnectedByRelationshipType(edges);
  const neighborKeys = new Set<string>();

  for (const edge of edges) {
    const peer =
      edge.direction === "outbound"
        ? `${edge.targetEntityType}:${edge.targetEntityId}`
        : `${edge.sourceEntityType}:${edge.sourceEntityId}`;
    neighborKeys.add(peer);
  }

  return {
    entityType,
    entityId,
    nodes,
    edges,
    byRelationshipType,
    stats: {
      edgeCount: edges.length,
      nodeCount: nodes.length,
      neighborCount: neighborKeys.size,
    },
  };
}

export function findPathsInMemory(
  anchorType: GraphEntityType,
  anchorId: string,
  relationships: Relationship[],
  targetType: GraphEntityType,
  targetId: string,
  maxDepth = 4,
): GraphPathResult {
  if (maxDepth < 1) {
    return { found: false, maxDepth, paths: [] };
  }

  const anchorKey = `${anchorType}:${anchorId}`;
  const targetKey = `${targetType}:${targetId}`;

  if (anchorKey === targetKey) {
    return {
      found: true,
      maxDepth,
      paths: [{ nodes: [{ entityType: anchorType, entityId: anchorId }], edges: [] }],
    };
  }

  type QueueItem = {
    key: string;
    type: GraphEntityType;
    id: string;
    pathEdges: EcosystemGraphEdge[];
    visited: Set<string>;
  };

  const paths: GraphPathResult["paths"] = [];
  const queue: QueueItem[] = [
    {
      key: anchorKey,
      type: anchorType,
      id: anchorId,
      pathEdges: [],
      visited: new Set([anchorKey]),
    },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.pathEdges.length >= maxDepth) continue;

    for (const row of relationships) {
      let nextType: GraphEntityType | null = null;
      let nextId: string | null = null;
      let directionAnchor = current.type;
      let directionId = current.id;

      if (
        row.sourceEntityType === current.type &&
        row.sourceEntityId === current.id
      ) {
        nextType = row.targetEntityType;
        nextId = row.targetEntityId;
      } else if (
        row.targetEntityType === current.type &&
        row.targetEntityId === current.id
      ) {
        nextType = row.sourceEntityType;
        nextId = row.sourceEntityId;
      } else {
        continue;
      }

      const nextKey = `${nextType}:${nextId}`;
      if (current.visited.has(nextKey)) continue;

      const edge = toEcosystemGraphEdge(row, directionAnchor, directionId);
      const nextEdges = [...current.pathEdges, edge];
      const nextVisited = new Set(current.visited);
      nextVisited.add(nextKey);

      if (nextKey === targetKey) {
        const nodes: GraphNodeRef[] = [{ entityType: anchorType, entityId: anchorId }];
        for (const pathEdge of nextEdges) {
          const peer =
            pathEdge.direction === "outbound"
              ? {
                  entityType: pathEdge.targetEntityType,
                  entityId: pathEdge.targetEntityId,
                }
              : {
                  entityType: pathEdge.sourceEntityType,
                  entityId: pathEdge.sourceEntityId,
                };
          nodes.push(peer);
        }
        paths.push({ nodes, edges: nextEdges });
        continue;
      }

      queue.push({
        key: nextKey,
        type: nextType,
        id: nextId,
        pathEdges: nextEdges,
        visited: nextVisited,
      });
    }
  }

  return { found: paths.length > 0, maxDepth, paths };
}

export type RelationshipCreateData = {
  sourceEntityType: GraphEntityType;
  sourceEntityId: string;
  targetEntityType: GraphEntityType;
  targetEntityId: string;
  relationshipType: RelationshipType;
  strength?: number | null;
  weight?: number | null;
  metadata?: Record<string, unknown>;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
};

export type RelationshipUpdateData = Partial<
  Omit<RelationshipCreateData, "sourceEntityType" | "sourceEntityId" | "targetEntityType" | "targetEntityId">
>;

export function toRelationshipCreateInput(
  data: RelationshipCreateData,
): Omit<Prisma.RelationshipCreateInput, "id"> {
  return {
    sourceEntityType: data.sourceEntityType,
    sourceEntityId: data.sourceEntityId,
    targetEntityType: data.targetEntityType,
    targetEntityId: data.targetEntityId,
    relationshipType: data.relationshipType,
    strength: data.strength ?? null,
    weight: data.weight ?? data.strength ?? null,
    metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
    effectiveFrom: data.effectiveFrom ?? null,
    effectiveTo: data.effectiveTo ?? null,
  };
}
