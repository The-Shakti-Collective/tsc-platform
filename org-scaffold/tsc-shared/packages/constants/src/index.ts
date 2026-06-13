/** Shared TSC constants — keep in sync with packages/constants. */
export const TSC_API_VERSION = 'v1';

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_MEMBERS_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 50;
export const MAX_PUBLIC_PAGE_SIZE = 100;

export const QUEUE_NAMES = {
  feed: 'tsc.feed',
  reputation: 'tsc.reputation',
  graph: 'tsc.graph',
  recommendation: 'tsc.recommendation',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface QueueJobStub<T = Record<string, unknown>> {
  name: string;
  data: T;
}

export const FEED_JOB_NAMES = {
  fanOutPost: 'feed.fan_out_post',
  rebuildTimeline: 'feed.rebuild_timeline',
} as const;

export const REPUTATION_JOB_NAMES = {
  recomputePerson: 'reputation.recompute_person',
  snapshotCommunity: 'reputation.snapshot_community',
} as const;

export const GRAPH_JOB_NAMES = {
  syncEdge: 'graph.sync_edge',
  rebuildSubgraph: 'graph.rebuild_subgraph',
} as const;

export const RECOMMENDATION_JOB_NAMES = {
  scoreCandidates: 'recommendation.score_candidates',
  refreshDiscover: 'recommendation.refresh_discover',
} as const;
