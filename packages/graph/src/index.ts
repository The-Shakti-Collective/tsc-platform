/**
 * Relationship graph engine — re-exports from @tsc/database.
 * Owns traversal, subgraph building, and graph constants.
 */
export {
  GRAPH_ENTITY_TYPES,
  RELATIONSHIP_TYPES,
  LEGACY_RELATIONSHIP_TYPE_MAP,
  buildEntitySubgraph,
  findPathsInMemory,
  collectGraphNodes,
  normalizeRelationshipType,
  type GraphEntityType,
  type Relationship,
  type RelationshipType,
} from "@tsc/database";
