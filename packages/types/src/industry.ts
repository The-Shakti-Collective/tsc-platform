export interface CityIntelligenceInput {
  city: string;
  artistsCount?: number;
  fansCount?: number;
  venuesCount?: number;
  eventsCount?: number;
  revenue?: number;
  communityMembers?: number;
}

export interface CityIntelligenceMetrics {
  city: string;
  heatScore: number;
  artistDensity: number;
  fanDensity: number;
  eventCadence: number;
  revenueIndex: number;
  communityIndex: number;
}

export type BrandStatus = 'active' | 'pending' | 'archived';

export type BrandBudgetRange =
  | 'under_5l'
  | 'five_to_25l'
  | 'twenty_five_to_1cr'
  | 'over_1cr'
  | 'undisclosed';

export interface IndustryPersonSummary {
  id: string;
  name: string;
  slug: string | null;
}

export interface BrandSummary {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  logo: string | null;
  description: string | null;
  budgetRange: BrandBudgetRange | null;
  categories: string[];
  verified: boolean;
  status: BrandStatus;
  trustScore: number | null;
  personId: string | null;
  ownerName: string | null;
  ownerSlug: string | null;
  opportunityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDetail extends BrandSummary {
  campaignCount: number;
}

export interface BrandListPayload {
  items: BrandSummary[];
  filters: {
    industry: string | null;
    city: string | null;
    status: BrandStatus | null;
    verified: boolean | null;
  };
  updatedAt: string;
}

export interface BrandCampaignsPayload {
  brandId: string;
  items: [];
  stubbed: true;
  message: string;
  updatedAt: string;
}

export interface BrandOpportunitySummary {
  id: string;
  title: string;
  listingType: string | null;
  category: string | null;
  city: string | null;
  genre: string | null;
  deadline: string | null;
  status: string;
  value: number | null;
  budget: number | null;
  applicationCount: number;
  updatedAt: string;
}

export interface BrandOpportunitiesPayload {
  brandId: string;
  items: BrandOpportunitySummary[];
  updatedAt: string;
}

export interface BrandOpportunityCreatedPayload {
  id: string;
  brandId: string;
  title: string;
  status: string;
  category: string | null;
  createdAt: string;
}

export interface AgencySummary {
  id: string;
  name: string;
  website: string | null;
  city: string | null;
  teamSize: number | null;
  personId: string | null;
  contactName: string | null;
  contactSlug: string | null;
  representedArtistCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyDetail extends AgencySummary {}

export interface AgencyListPayload {
  items: AgencySummary[];
  filters: { city: string | null };
  updatedAt: string;
}

export interface AgencyArtistSummary {
  artistId: string;
  artistName: string;
  artistSlug: string | null;
  relationshipId: string;
  relationshipType: 'MANAGES';
  since: string | null;
}

export interface AgencyArtistsPayload {
  agencyId: string;
  items: AgencyArtistSummary[];
  updatedAt: string;
}

export interface LabelSummary {
  id: string;
  name: string;
  genre: string | null;
  website: string | null;
  city: string | null;
  rosterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabelDetail extends LabelSummary {}

export interface LabelListPayload {
  items: LabelSummary[];
  filters: { genre: string | null; city: string | null };
  updatedAt: string;
}

export interface LabelRosterArtist {
  artistId: string;
  artistName: string;
  artistSlug: string | null;
  relationshipId: string;
  relationshipType: 'MANAGES' | 'SIGNED_TO';
  since: string | null;
}

export interface LabelRosterPayload {
  labelId: string;
  items: LabelRosterArtist[];
  updatedAt: string;
}

export interface LabelSigningStubPayload {
  labelId: string;
  artistId: string;
  relationshipId: string;
  relationshipType: 'SIGNED_TO';
  stubbed: true;
  message: string;
  createdAt: string;
}
