import type { CommandCenterV4AudienceKpis } from './audience.js';
import type {
  CommandCenterV5ActionableInsight,
  CommandCenterV5Payload,
  CommandCenterV5WorkflowBlock,
} from './agents.js';
import type { AudienceSnapshotScores } from './relationship.js';
import type { CityIntelligenceMetrics } from './industry.js';
import type { EntityGraphSummary } from './relationship.js';

export type {
  CommandCenterV4AudienceKpis,
  CommandCenterV5ActionableInsight,
  CommandCenterV5Payload,
  CommandCenterV5WorkflowBlock,
};

export type OpportunityHeat = 'hot' | 'warm' | 'cold';

export type AutomationWorkflowType =
  | 'artist_path'
  | 'booking_inquiry'
  | 'workshop_lead'
  | 'signal_rule';

export interface AutomationStepRecord {
  step: string;
  status: 'completed' | 'skipped' | 'failed';
  summary: string;
  at: string;
  metadata?: Record<string, unknown>;
}

export interface AutomationRuleDto {
  id: string;
  name: string;
  workflowType: string;
  triggerType: string;
  trigger: Record<string, unknown>;
  steps: unknown[];
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRunDto {
  id: string;
  ruleId: string | null;
  ruleName?: string | null;
  triggerType?: string | null;
  status: string;
  trigger: Record<string, unknown>;
  steps: AutomationStepRecord[];
  result: Record<string, unknown>;
  opportunityId: string | null;
  personId: string | null;
  communityId: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AutomationTriggerResult {
  run: AutomationRunDto;
  workflowType: AutomationWorkflowType;
  stubbed: true;
}

export interface AutomationEvaluateResultItem {
  ruleId: string;
  ruleName: string;
  triggerType: string;
  matched: boolean;
  entityType: string;
  entityId: string;
  run: AutomationRunDto;
  error?: string;
}

export interface AutomationEvaluatePayload {
  scope: 'platform' | 'artist';
  artistId: string | null;
  evaluatedAt: string;
  rulesChecked: number;
  matches: number;
  fired: number;
  results: AutomationEvaluateResultItem[];
  stubbed: true;
}

export interface GoalDto {
  id: string;
  name: string | null;
  entityType: string;
  entityId: string;
  metric: string;
  target: number;
  current: number;
  period: string;
  periodStart: string | null;
  periodEnd: string | null;
  metadata: Record<string, unknown>;
  gap: number;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalDashboardEntry {
  goalId: string;
  name: string | null;
  metric: string;
  current: number;
  target: number;
  gap: number;
  projection: number;
  progressPercent: number;
  period: string;
  periodStart: string | null;
  periodEnd: string | null;
  onTrack: boolean;
}

export interface GoalDashboardEntity {
  entityType: string;
  entityId: string;
  goals: GoalDashboardEntry[];
}

export interface GoalDashboardPayload {
  entities: GoalDashboardEntity[];
  summary: {
    totalGoals: number;
    onTrack: number;
    atRisk: number;
    completed: number;
  };
  updatedAt: string;
}

export interface OpportunityScoreItem {
  id: string;
  title: string;
  status: string;
  score: number;
  bucket: OpportunityHeat;
  artistId: string | null;
  value: number | null;
  updatedAt: string;
}

export interface OpportunityScoresPayload {
  hot: OpportunityScoreItem[];
  warm: OpportunityScoreItem[];
  cold: OpportunityScoreItem[];
  updatedAt: string;
}

export interface SuggestedOpportunity {
  id: string;
  title: string;
  reason: string;
  score: number;
  source: string;
}

export interface ArtistHealthPayload {
  artistId: string;
  healthScore: number;
  status: 'healthy' | 'watch' | 'at_risk';
  followerCount: number;
  communityMembers: number;
  engagementRate: number;
  growthPercent: number;
  eventCount: number;
  updatedAt: string;
}

export interface RiskAlert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  code: string;
  message: string;
  detectedAt: string;
}

export interface IntelligenceFanScoresPayload {
  personId: string;
  artistId: string | null;
  scores: AudienceSnapshotScores;
  snapshotDate: string | null;
  calculatedAt: string;
}

export interface FanSegmentMember {
  personId: string;
  name: string;
  compositeScore: number;
  lastActiveDays: number;
}

export interface FanSegmentsPayload {
  artistId: string;
  super: FanSegmentMember[];
  active: FanSegmentMember[];
  casual: FanSegmentMember[];
  dormant: FanSegmentMember[];
  updatedAt: string;
}

export interface CityIntelligencePayload extends CityIntelligenceMetrics {
  snapshotDate: string | null;
  live: boolean;
}

export interface CityRecommendationsPayload {
  city: string;
  heatScore: number;
  recommendations: Array<{
    entityType: string;
    entityId: string;
    title: string;
    reason: string;
    score: number;
  }>;
  updatedAt: string;
}

export interface CommunityIntelligencePayload {
  communityId: string;
  memberCount: number;
  activeMemberCount: number;
  postCount30d: number;
  engagementRate: number;
  topGenres: string[];
  updatedAt: string;
}

export interface RecommendationListPayload {
  personId: string;
  entityType: string;
  items: Array<{
    entityId: string;
    score: number;
    reasonCodes: string[];
    title: string | null;
  }>;
  updatedAt: string;
}

export interface EcosystemGraphPayload extends EntityGraphSummary {
  updatedAt: string;
}

export interface IntelligenceGoal {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  deadline: string | null;
  category: string | null;
  status: 'active' | 'completed' | 'paused';
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutiveAggregatePayload {
  period: 'today' | 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  metrics: {
    newFollowers: number;
    newMembers: number;
    openOpportunities: number;
    hotOpportunities: number;
    activeArtists: number;
    atRiskArtists: number;
    avgArtistHealth: number;
    cityHeatAvg: number;
  };
  updatedAt: string;
}

export interface CommandCenterOpportunity {
  id: string;
  title: string;
  score: number;
  bucket: OpportunityHeat;
  status: string;
  value: number | null;
  artistId: string | null;
}

export interface CommandCenterArtistAtRisk {
  artistId: string;
  name: string;
  healthScore: number;
  status: 'healthy' | 'watch' | 'at_risk';
  alertCount: number;
  topAlert: string | null;
}

export interface CommandCenterCityHeat {
  city: string;
  heatScore: number;
  artistsCount: number;
  eventsCount: number;
  fansCount: number;
}

export interface CommandCenterCommunityGrowth {
  communityId: string;
  name: string;
  memberCount: number;
  newMembers: number;
  growthPct: number;
  engagementRate: number;
}

export interface CommandCenterForecast {
  projection: number;
  currency: string;
  period: string;
  label: string;
  basedOn: string;
  disclaimer: string;
}

export interface ParticipationTopContributor {
  personId: string;
  displayName: string;
  activityCount: number;
}

export interface ParticipationDashboardPayload {
  period: 'weekly' | 'monthly';
  dailyActiveMembers: number;
  newCollaborations: number;
  communityGrowth: number;
  participationRate: number;
  topContributors: ParticipationTopContributor[];
  ecosystemHealth: number;
  updatedAt: string;
}

export interface CommandCenterV3Revenue {
  openPipelineValue: number;
  closedThisPeriod: number;
  currency: string;
}

export interface CommandCenterV3Opportunities {
  activeCount: number;
  closingSoon: number;
}

export interface CommandCenterV3Brands {
  activeCount: number;
  newThisWeek: number;
  topBrands: Array<{
    id: string;
    name: string;
    trustScore: number | null;
    verified: boolean;
    opportunityCount: number;
  }>;
}

export interface CommandCenterV3Artists {
  highGrowthCount: number;
  atRiskCount: number;
}

export interface CommandCenterV3DealStage {
  stage: string;
  count: number;
  value: number;
}

export interface CommandCenterV3Deals {
  byStage: Record<string, number>;
  pipelineFunnel: CommandCenterV3DealStage[];
  totalOpen: number;
}

export interface CommandCenterV3Audience {
  mostLoyalCommunities: Array<{
    communityId: string;
    name: string;
    fanRetention: number;
    memberGrowth: number;
    activeMembers: number;
  }>;
  highestGrowthArtists: Array<{
    artistId: string;
    name: string;
    slug: string | null;
    audienceGrowth: number;
    fanRetention: number;
    lifetimeValueStub: number;
    snapshotDate: string;
  }>;
  highestChurnRisk: Array<{
    artistId: string;
    name: string;
    slug: string | null;
    fanRetention: number;
    audienceChurn: number;
    audienceGrowth: number;
    snapshotDate: string;
    riskLevel: 'elevated' | 'high';
  }>;
}

export interface CommandCenterV3Payload {
  revenue: CommandCenterV3Revenue;
  opportunities: CommandCenterV3Opportunities;
  brands: CommandCenterV3Brands;
  artists: CommandCenterV3Artists;
  deals: CommandCenterV3Deals;
  audience: CommandCenterV3Audience;
  updatedAt: string;
}

export interface CommandCenterV4Payload {
  period: 'weekly' | 'monthly';
  audienceKpis: CommandCenterV4AudienceKpis;
  insights: CommandCenterV3Audience;
  topOpportunities: CommandCenterOpportunity[];
  artistsAtRisk: CommandCenterArtistAtRisk[];
  citiesHeatingUp: CommandCenterCityHeat[];
  communitiesGrowingFast: CommandCenterCommunityGrowth[];
  revenueForecast: CommandCenterForecast;
  bookingDemandForecast: CommandCenterForecast & {
    openOpportunities: number;
    hotOpportunities: number;
  };
  executive: ExecutiveAggregatePayload;
  participation: ParticipationDashboardPayload;
  v3: CommandCenterV3Payload;
  updatedAt: string;
}

export interface CommandCenterPayload {
  period: 'weekly' | 'monthly';
  topOpportunities: CommandCenterOpportunity[];
  artistsAtRisk: CommandCenterArtistAtRisk[];
  citiesHeatingUp: CommandCenterCityHeat[];
  communitiesGrowingFast: CommandCenterCommunityGrowth[];
  revenueForecast: CommandCenterForecast;
  bookingDemandForecast: CommandCenterForecast & {
    openOpportunities: number;
    hotOpportunities: number;
  };
  executive: ExecutiveAggregatePayload;
  participation: ParticipationDashboardPayload;
  v3: CommandCenterV3Payload;
  updatedAt: string;
}

export interface IntelligenceActionResult {
  success: true;
  action: string;
  stubbed: boolean;
  message: string;
  receivedAt: string;
  payload: Record<string, unknown>;
}
