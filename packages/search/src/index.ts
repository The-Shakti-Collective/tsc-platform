/** Search package stub — Elasticsearch/Typesense integration in Stage 2+. */

export const SEARCH_NOT_CONFIGURED = true as const;

export interface SearchPlaceholderResult {
  readonly configured: false;
  readonly message: string;
}

export function searchPlaceholder(_query: string): SearchPlaceholderResult {
  return {
    configured: false,
    message: "Search index not configured. Wire in Stage 2+.",
  };
}
