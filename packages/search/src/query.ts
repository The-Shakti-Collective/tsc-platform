import type { TypesenseClient } from './client.js';
import {
  COLLECTION_QUERY_BY,
  SEARCH_COLLECTIONS,
  type SearchCollectionName,
} from './collections.js';

export type SearchHit = {
  collection: SearchCollectionName;
  document: Record<string, unknown>;
  highlight?: Record<string, unknown>;
  textMatch?: number;
};

export type SearchResponse = {
  query: string;
  configured: boolean;
  hits: SearchHit[];
  found: number;
  limit: number;
  collections?: SearchCollectionName[];
  message?: string;
};

function mapHit(
  collection: SearchCollectionName,
  hit: Record<string, unknown>,
): SearchHit {
  return {
    collection,
    document: (hit.document as Record<string, unknown>) ?? {},
    highlight: hit.highlight as Record<string, unknown> | undefined,
    textMatch: hit.text_match as number | undefined,
  };
}

export async function searchCollection(
  client: TypesenseClient,
  collection: SearchCollectionName,
  query: string,
  limit = 20,
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: trimmed,
      configured: true,
      hits: [],
      found: 0,
      limit,
      collections: [collection],
    };
  }

  const result = await client
    .collections(collection)
    .documents()
    .search({
      q: trimmed,
      query_by: COLLECTION_QUERY_BY[collection],
      per_page: limit,
    });

  const hits = (result.hits ?? []).map((hit) =>
    mapHit(collection, hit as unknown as Record<string, unknown>),
  );

  return {
    query: trimmed,
    configured: true,
    hits,
    found: result.found ?? hits.length,
    limit,
    collections: [collection],
  };
}

export async function searchAll(
  client: TypesenseClient,
  query: string,
  limit = 20,
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: trimmed,
      configured: true,
      hits: [],
      found: 0,
      limit,
      collections: [...SEARCH_COLLECTIONS],
    };
  }

  const perCollection = Math.max(3, Math.ceil(limit / SEARCH_COLLECTIONS.length));
  const searches = SEARCH_COLLECTIONS.map((collection) => ({
    collection,
    q: trimmed,
    query_by: COLLECTION_QUERY_BY[collection],
    per_page: perCollection,
  }));

  const result = await client.multiSearch.perform({ searches });
  const hits: SearchHit[] = [];
  let found = 0;

  for (const [index, collection] of SEARCH_COLLECTIONS.entries()) {
    const payload = result.results[index] as {
      found?: number;
      hits?: Array<Record<string, unknown>>;
    };
    found += payload.found ?? 0;
    for (const hit of payload.hits ?? []) {
      hits.push(mapHit(collection, hit));
    }
  }

  hits.sort((a, b) => (b.textMatch ?? 0) - (a.textMatch ?? 0));

  return {
    query: trimmed,
    configured: true,
    hits: hits.slice(0, limit),
    found,
    limit,
    collections: [...SEARCH_COLLECTIONS],
  };
}

export async function pingTypesense(client: TypesenseClient): Promise<boolean> {
  try {
    const health = await client.health.retrieve();
    return health.ok === true;
  } catch {
    return false;
  }
}
