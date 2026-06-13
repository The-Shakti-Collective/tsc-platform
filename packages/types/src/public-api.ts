export const API_KEY_HEADER = 'x-tsc-api-key';

export const DEFAULT_API_RATE_LIMIT = 100;

export const API_SCOPES = [
  'read:artists',
  'read:communities',
  'read:opportunities',
  'read:events',
  'read:venues',
  'read:analytics',
  'read:identity',
  'read:export',
  'read:graph',
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export const WHITE_LABEL_TENANT_TYPES = ['agency', 'community', 'festival'] as const;

export type WhiteLabelTenantType = (typeof WHITE_LABEL_TENANT_TYPES)[number];

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  scopes: ApiScope[];
  ownerOrgId: string | null;
  rateLimit: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyCreatedPayload extends ApiKeySummary {
  /** Returned once at creation — not stored in plaintext */
  key: string;
}

export interface PublicPaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PublicArtistSummary {
  id: string;
  name: string;
  slug: string;
  displayName: string | null;
  city: string | null;
  genres: string[];
  photoUrl: string | null;
}

export interface PublicArtistListPayload {
  items: PublicArtistSummary[];
  pagination: PublicPaginationMeta;
  filters: { city: string | null; genre: string | null };
  updatedAt: string;
}

export interface PublicArtistDetailPayload extends PublicArtistSummary {
  bio: string | null;
  updatedAt: string;
}

export interface PublicCommunitySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  genres: string[];
}

export interface PublicCommunityListPayload {
  items: PublicCommunitySummary[];
  pagination: PublicPaginationMeta;
  updatedAt: string;
}

export interface PublicOpportunitySummary {
  id: string;
  title: string;
  category: string;
  city: string | null;
  status: string;
  deadline: string | null;
  listingType: string | null;
}

export interface PublicOpportunityListPayload {
  items: PublicOpportunitySummary[];
  pagination: PublicPaginationMeta;
  updatedAt: string;
}

export interface PublicEventSummary {
  id: string;
  title: string;
  slug: string | null;
  city: string | null;
  startsAt: string;
  artistId: string | null;
  venueId: string | null;
}

export interface PublicEventListPayload {
  items: PublicEventSummary[];
  pagination: PublicPaginationMeta;
  updatedAt: string;
}

export interface PublicVenueSummary {
  id: string;
  name: string;
  city: string | null;
  capacity: number | null;
  eventCount: number;
}

export interface PublicVenueListPayload {
  items: PublicVenueSummary[];
  pagination: PublicPaginationMeta;
  updatedAt: string;
}

export interface PublicAnalyticsSummaryPayload {
  artists: number;
  communities: number;
  opportunities: number;
  events: number;
  venues: number;
  identities: number;
  updatedAt: string;
}

export interface WhiteLabelNavItem {
  label: string;
  path: string;
}

export interface WhiteLabelTenantConfig {
  agencyId?: string;
  communityId?: string;
  festivalEventIds?: string[];
  navItems?: WhiteLabelNavItem[];
  tagline?: string;
}

export interface WhiteLabelBrandingConfig {
  slug: string;
  name: string;
  type: WhiteLabelTenantType;
  customDomain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  config: WhiteLabelTenantConfig;
  isActive: boolean;
  updatedAt: string;
}

export interface WhiteLabelTenantSummary extends WhiteLabelBrandingConfig {
  id: string;
  apiKeyId: string | null;
  createdAt: string;
}

export interface WhiteLabelTenantArtistsPayload {
  tenantSlug: string;
  tenantType: WhiteLabelTenantType;
  agencyId: string | null;
  items: Array<{
    artistId: string;
    artistName: string;
    artistSlug: string;
    relationshipType: 'MANAGES';
    since: string;
  }>;
  updatedAt: string;
}
