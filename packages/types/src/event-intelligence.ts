export interface EventIntelligenceSnapshotPayload {
  eventId: string;
  snapshotDate: string;
  predictedAttendance: number | null;
  actualAttendance: number;
  predictedRevenueStub: number | null;
  actualRevenueStub: number;
  conversionRate: number;
  audienceGrowthImpact: number;
  communityImpact: number;
  fanDensityByCity: Record<string, number>;
  metrics: Record<string, unknown>;
  live?: boolean;
  updatedAt: string;
}

export interface EventIntelligencePredictPayload {
  eventId: string;
  predictedAttendance: number;
  predictedRevenueStub: number;
  factors: Record<string, number>;
  updatedAt: string;
}

export interface EventIntelligenceRefreshPayload extends EventIntelligenceSnapshotPayload {
  previousSnapshotDate: string | null;
  recomputed: boolean;
}

export interface EventIntelligenceRecommendation {
  entityType: 'City' | 'Venue' | 'Partner';
  entityId: string;
  title: string;
  reason: string;
  score: number;
}

export interface EventIntelligenceRecommendationsPayload {
  eventId: string;
  cities: EventIntelligenceRecommendation[];
  venues: EventIntelligenceRecommendation[];
  partners: EventIntelligenceRecommendation[];
  updatedAt: string;
}

export interface CityFanDensityItem {
  city: string;
  fanCount: number;
  eventCount: number;
  densityScore: number;
}

export interface CityFanDensityPayload {
  cities: CityFanDensityItem[];
  updatedAt: string;
}

export interface ConversionLeaderItem {
  artistId: string;
  name: string;
  slug: string | null;
  avgConversionRate: number;
  eventCount: number;
}

export interface ConversionLeadersPayload {
  artists: ConversionLeaderItem[];
  updatedAt: string;
}

export interface RepeatAttendanceCommunityItem {
  communityId: string;
  name: string;
  slug: string;
  repeatAttendeeCount: number;
  totalEvents: number;
  repeatRate: number;
}

export interface RepeatAttendancePayload {
  communities: RepeatAttendanceCommunityItem[];
  updatedAt: string;
}
