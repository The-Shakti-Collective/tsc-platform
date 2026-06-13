export interface BrandMatchRequest {
  brandId: string;
  genre?: string;
  city?: string;
  budget?: number;
  audienceAge?: string;
}

export interface BrandMatchArtistResult {
  artistId: string;
  artistName: string | null;
  slug: string | null;
  city: string | null;
  genres: string[];
  score: number;
  confidence: number;
  trustScore: number | null;
  reasonCodes: string[];
  factors: {
    artistMatch: number;
    location: number;
    engagement: number;
    brandFit: number;
    revenuePotential: number;
    trustWeight: number;
  };
}

export interface BrandMatchPayload {
  brandId: string;
  criteria: {
    genre: string | null;
    city: string | null;
    budget: number | null;
    audienceAge: string | null;
  };
  items: BrandMatchArtistResult[];
  updatedAt: string;
}

export interface ArtistOpportunitiesV2Request {
  artistId: string;
  limit?: number;
}

export interface ArtistOpportunityV2Result {
  opportunityId: string;
  title: string;
  listingType: string | null;
  city: string | null;
  genre: string | null;
  budget: number | null;
  score: number;
  confidence: number;
  brandTrustScore: number | null;
  reasonCodes: string[];
}

export interface ArtistOpportunitiesV2Payload {
  artistId: string;
  items: ArtistOpportunityV2Result[];
  updatedAt: string;
}
