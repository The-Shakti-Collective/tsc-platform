export type CollectionSchema = {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    optional?: boolean;
    facet?: boolean;
  }>;
  default_sorting_field?: string;
};

export const SEARCH_COLLECTIONS = [
  'artists',
  'opportunities',
  'projects',
  'organizations',
  'community_profiles',
] as const;

export type SearchCollectionName = (typeof SEARCH_COLLECTIONS)[number];

export const COLLECTION_SCHEMAS: CollectionSchema[] = [
  {
    name: 'artists',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'displayName', type: 'string', optional: true },
      { name: 'slug', type: 'string' },
      { name: 'bio', type: 'string', optional: true },
      { name: 'updatedAt', type: 'int64' },
    ],
    default_sorting_field: 'updatedAt',
  },
  {
    name: 'opportunities',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'category', type: 'string', facet: true },
      { name: 'city', type: 'string', optional: true, facet: true },
      { name: 'status', type: 'string', facet: true },
      { name: 'genre', type: 'string', optional: true, facet: true },
      { name: 'listingType', type: 'string', optional: true, facet: true },
      { name: 'requirements', type: 'string[]', optional: true },
      { name: 'updatedAt', type: 'int64' },
    ],
    default_sorting_field: 'updatedAt',
  },
  {
    name: 'projects',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'slug', type: 'string' },
      { name: 'description', type: 'string', optional: true },
      { name: 'status', type: 'string', facet: true },
      { name: 'type', type: 'string', facet: true },
      { name: 'workspaceId', type: 'string', facet: true },
      { name: 'updatedAt', type: 'int64' },
    ],
    default_sorting_field: 'updatedAt',
  },
  {
    name: 'organizations',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'slug', type: 'string' },
      { name: 'type', type: 'string', optional: true, facet: true },
      { name: 'updatedAt', type: 'int64' },
    ],
    default_sorting_field: 'updatedAt',
  },
  {
    name: 'community_profiles',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'slug', type: 'string' },
      { name: 'description', type: 'string', optional: true },
      { name: 'city', type: 'string', optional: true, facet: true },
      { name: 'genres', type: 'string[]', optional: true, facet: true },
      { name: 'artistId', type: 'string', optional: true },
      { name: 'updatedAt', type: 'int64' },
    ],
    default_sorting_field: 'updatedAt',
  },
];

export const COLLECTION_QUERY_BY: Record<SearchCollectionName, string> = {
  artists: 'name,displayName,slug,bio',
  opportunities: 'title,category,city,genre,requirements',
  projects: 'name,slug,description,status,type',
  organizations: 'name,slug,type',
  community_profiles: 'name,slug,description,city,genres',
};
