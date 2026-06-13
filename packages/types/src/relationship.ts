/** Phase 6 relationship graph types. */

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
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

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
] as const;

export type GraphEntityType = (typeof GRAPH_ENTITY_TYPES)[number];

export interface RelationshipRecord {
  id: string;
  sourceEntityType: GraphEntityType;
  sourceEntityId: string;
  targetEntityType: GraphEntityType;
  targetEntityId: string;
  relationshipType: RelationshipType;
  strength: number | null;
  weight: number | null;
  metadata: Record<string, unknown>;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface ConnectedNode {
  entityType: GraphEntityType;
  entityId: string;
  direction: "outbound" | "inbound";
  relationshipId: string;
  strength: number | null;
  weight: number | null;
  metadata: Record<string, unknown>;
}

export interface EntitySubgraphResponse {
  entityType: GraphEntityType;
  entityId: string;
  nodes: Array<{ entityType: GraphEntityType; entityId: string }>;
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
  updatedAt: string;
}

export interface EntityGraphSummary {
  entityType: GraphEntityType;
  entityId: string;
  nodeCount: number;
  edgeCount: number;
  relationshipCounts: Record<string, number>;
  topConnections: Array<{
    entityType: string;
    entityId: string;
    relationshipType: string;
    strength: number | null;
  }>;
}

/** Legacy analytics types referenced by partial API workspace. */
export interface AudienceSnapshotScores {
  compositeScore: number;
  calculatedAt: string;
  [key: string]: unknown;
}

export interface AudienceIntelligenceInput {
  personId: string;
  artistId?: string;
  [key: string]: unknown;
}

export type SuggestedOpportunityStatus = "suggested" | "accepted" | "dismissed" | "expired";
export type ScoreTier = "hot" | "warm" | "cold";
export type FanIntelligenceTier = "super" | "active" | "casual" | "dormant";
export type CityRecommendationType =
  | "expand_market"
  | "host_event"
  | "partner_venue"
  | "grow_community"
  | "recruit_talent"
  | "other";
export type RecommendationEntityType =
  | "Artist"
  | "Event"
  | "Community"
  | "CommunityPost";
