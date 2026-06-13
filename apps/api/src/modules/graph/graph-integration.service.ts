import { Injectable } from '@nestjs/common';

export const SPRINT1_GRAPH_EDGE_TYPES = [
  'MEMBER_OF',
  'ATTENDED',
  'FOLLOWS',
  'COLLABORATED_WITH',
] as const;

export type Sprint1GraphEdgeType = (typeof SPRINT1_GRAPH_EDGE_TYPES)[number];

export interface GraphEdgeInput {
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  relationshipType: Sprint1GraphEdgeType;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class GraphIntegrationService {
  /** Sprint 1 stub — enqueue graph sync; full worker in later sprint. */
  async recordEdge(input: GraphEdgeInput): Promise<{ queued: boolean; edge: GraphEdgeInput }> {
    return {
      queued: false,
      edge: input,
    };
  }

  async listSupportedEdgeTypes(): Promise<readonly Sprint1GraphEdgeType[]> {
    return SPRINT1_GRAPH_EDGE_TYPES;
  }
}
