export type AgentType =
  | 'opportunity'
  | 'career'
  | 'community'
  | 'event'
  | 'brand_match'
  | 'talent_discovery'
  | 'forecast'
  | 'copilot'
  | 'workflow';

export type AgentDecisionStatus = 'pending' | 'approved' | 'rejected' | 'executed';

export type AgentRecommendationStatus =
  | 'pending'
  | 'active'
  | 'dismissed'
  | 'applied'
  | 'expired';

export interface AgentRecommendationSummary {
  id: string;
  agentId: string;
  agentSlug: string | null;
  agentName: string | null;
  agentType: AgentType | null;
  targetPersonId: string | null;
  targetArtistId: string | null;
  title: string;
  rationale: string;
  score: number;
  confidence: number;
  status: AgentRecommendationStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRecommendationsPayload {
  artistId: string | null;
  personId: string | null;
  items: AgentRecommendationSummary[];
  updatedAt: string;
}

export interface AgentDecisionSummary {
  id: string;
  agentId: string;
  entityType: string;
  entityId: string;
  decisionType: string;
  payload: Record<string, unknown>;
  confidence: number;
  status: AgentDecisionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDecisionPayload {
  decision: AgentDecisionSummary;
  updatedAt: string;
}

export interface OpportunityAgentRunPayload {
  artistId: string;
  taskId: string;
  recommendationsCreated: number;
  items: AgentRecommendationSummary[];
  updatedAt: string;
}

export type CareerSuggestedActionType =
  | 'play_city'
  | 'collaborate'
  | 'apply_opportunity'
  | 'grow_community'
  | 'improve_health';

export type CareerActionPriority = 'low' | 'medium' | 'high';

export interface CareerAgentRunPayload {
  artistId: string;
  taskId: string;
  recommendationsCreated: number;
  decisionsCreated: number;
  items: AgentRecommendationSummary[];
  updatedAt: string;
}

export interface CareerActionsPayload {
  artistId: string;
  items: AgentRecommendationSummary[];
  updatedAt: string;
}

export interface CareerDashboardPayload {
  artistId: string;
  healthScore: number | null;
  audienceGrowth: number | null;
  reputationScore: number | null;
  trustScore: number | null;
  superfanCount: number;
  communityCount: number;
  revenueStub: number | null;
  activeActions: AgentRecommendationSummary[];
  actionCountsByType: Partial<Record<CareerSuggestedActionType, number>>;
  lastRunAt: string | null;
  updatedAt: string;
}

export interface CareerActionDismissPayload {
  id: string;
  status: AgentRecommendationStatus;
  updatedAt: string;
}

export type CommunitySuggestionType =
  | 'suggest_event'
  | 'create_poll'
  | 'recommend_member'
  | 're_engage_member';

export type CommunitySuggestionPriority = 'low' | 'medium' | 'high';

export interface CommunityModeratorCandidate {
  personId: string;
  name: string;
  postCount30d: number;
  contributorScore: number;
  currentRole: string;
  lastActiveAt: string | null;
}

export interface CommunityAgentRunPayload {
  communityId: string;
  taskId: string;
  recommendationsCreated: number;
  decisionsCreated: number;
  inactiveMemberCount: number;
  moderatorCandidateCount: number;
  items: AgentRecommendationSummary[];
  updatedAt: string;
}

export interface CommunitySuggestionsPayload {
  communityId: string;
  inactiveMemberCount: number;
  moderatorCandidates: CommunityModeratorCandidate[];
  upcomingTrends: string[];
  items: AgentRecommendationSummary[];
  lastRunAt: string | null;
  updatedAt: string;
}

export interface CommunitySuggestionApprovePayload {
  id: string;
  status: AgentRecommendationStatus;
  decisionStatus: AgentDecisionStatus;
  executedStub: string;
  updatedAt: string;
}

export interface CommunitySuggestionDismissPayload {
  id: string;
  status: AgentRecommendationStatus;
  updatedAt: string;
}

export type EventAgentPhase = 'pre' | 'post';

export type EventSuggestionType =
  | 'optimize_marketing'
  | 'adjust_capacity'
  | 'partner_venue'
  | 'repeat_in_city'
  | 'book_venue_again'
  | 'expand_community';

export type EventSuggestionPriority = 'low' | 'medium' | 'high';

export interface EventAgentPredictSummary {
  predictedAttendance: number;
  predictedRevenueStub: number;
  factors: Record<string, number>;
}

export interface EventAgentAnalysisSummary {
  conversionRate: number;
  audienceGrowthImpact: number;
  communityImpact: number;
  actualAttendance: number;
  actualRevenueStub: number;
  fanDensityByCity: Record<string, number>;
}

export interface EventAgentRunPayload {
  eventId: string;
  phase: EventAgentPhase;
  taskId: string;
  recommendationsCreated: number;
  decisionsCreated: number;
  items: AgentRecommendationSummary[];
  updatedAt: string;
}

export interface EventAgentInsightsPayload {
  eventId: string;
  phase: EventAgentPhase;
  eventStartsAt: string | null;
  predictions: EventAgentPredictSummary | null;
  analysis: EventAgentAnalysisSummary | null;
  intelligenceRecommendations: {
    cities: Array<{ entityType: string; entityId: string; title: string; reason: string; score: number }>;
    venues: Array<{ entityType: string; entityId: string; title: string; reason: string; score: number }>;
    partners: Array<{ entityType: string; entityId: string; title: string; reason: string; score: number }>;
  };
  items: AgentRecommendationSummary[];
  lastRunAt: string | null;
  updatedAt: string;
}

export interface EventSuggestionApprovePayload {
  id: string;
  status: AgentRecommendationStatus;
  decisionStatus: AgentDecisionStatus;
  executedStub: string;
  updatedAt: string;
}

export interface EventSuggestionDismissPayload {
  id: string;
  status: AgentRecommendationStatus;
  updatedAt: string;
}

export interface BrandMatchCampaignBrief {
  genre: string | null;
  audienceAge: string | null;
  city: string | null;
  budget: number | null;
}

export interface BrandMatchAgentRunPayload {
  brandId: string;
  taskId: string;
  decisionId: string | null;
  recommendationsCreated: number;
  brief: BrandMatchCampaignBrief;
  items: AgentRecommendationSummary[];
  updatedAt: string;
}

export interface BrandMatchAgentResultsPayload {
  brandId: string;
  brief: BrandMatchCampaignBrief;
  taskId: string | null;
  decision: AgentDecisionSummary | null;
  items: AgentRecommendationSummary[];
  lastRunAt: string | null;
  updatedAt: string;
}

export interface BrandMatchCampaignHistoryEntry {
  taskId: string;
  brief: BrandMatchCampaignBrief;
  recommendationsCreated: number;
  topArtistName: string | null;
  completedAt: string;
}

export interface BrandMatchCampaignHistoryPayload {
  brandId: string;
  campaigns: BrandMatchCampaignHistoryEntry[];
  updatedAt: string;
}

export interface BrandMatchInvitePayload {
  id: string;
  status: AgentRecommendationStatus;
  invitedStub: string;
  updatedAt: string;
}

export type TalentDiscoveryAlertEntityType = 'Artist' | 'Community' | 'City';

export interface TalentDiscoveryAlertSummary {
  id: string;
  entityType: TalentDiscoveryAlertEntityType;
  entityId: string;
  title: string;
  rationale: string;
  growthPercent: number;
  score: number;
  confidence: number;
  status: AgentRecommendationStatus;
  reasonCodes: string[];
  superfanVelocityStub: number | null;
  activityVelocityStub: number | null;
  city: string | null;
  genre: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TalentDiscoveryAgentRunPayload {
  taskId: string;
  decisionId: string | null;
  alertsCreated: number;
  artistAlerts: number;
  communityAlerts: number;
  cityAlerts: number;
  items: TalentDiscoveryAlertSummary[];
  updatedAt: string;
}

export interface TalentDiscoveryAlertsPayload {
  taskId: string | null;
  decision: AgentDecisionSummary | null;
  items: TalentDiscoveryAlertSummary[];
  lastRunAt: string | null;
  updatedAt: string;
}

export interface TalentDiscoveryAlertAckPayload {
  id: string;
  status: AgentRecommendationStatus;
  acknowledgedStub: string;
  updatedAt: string;
}

export interface TalentDiscoveryEmergingCityEntry {
  city: string;
  genre: string | null;
  sceneKey: string;
  growthPercent: number;
  eventDensityGrowth: number;
  memberGrowth: number;
  activityVelocity: number;
  heatScore: number;
  alertId: string | null;
}

export interface TalentDiscoveryEmergingCitiesPayload {
  items: TalentDiscoveryEmergingCityEntry[];
  threshold: number;
  updatedAt: string;
}

export interface TalentDiscoveryFastGrowingArtistEntry {
  artistId: string;
  name: string;
  slug: string;
  audienceGrowth: number;
  superfanVelocityStub: number | null;
  activityVelocityStub: number | null;
  score: number;
  alertId: string | null;
}

export interface TalentDiscoveryFastGrowingArtistsPayload {
  items: TalentDiscoveryFastGrowingArtistEntry[];
  threshold: number;
  updatedAt: string;
}

export type ForecastMetric =
  | 'revenue'
  | 'attendance'
  | 'growth'
  | 'demand'
  | 'membership_churn';

export type ForecastHorizon = 'd30' | 'd90';

export type InsightSeverity = 'info' | 'warning' | 'critical';

export type InsightActionStatus = 'pending' | 'executed' | 'failed';

export interface ForecastSnapshotSummary {
  snapshotDate: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  factors: Record<string, unknown>;
}

export interface ForecastSummary {
  id: string;
  entityType: string;
  entityId: string;
  metric: ForecastMetric;
  horizon: ForecastHorizon;
  modelVersion: string;
  latestSnapshot: ForecastSnapshotSummary | null;
  createdAt: string;
}

export interface ForecastAgentRunPayload {
  taskId: string;
  entityType: string;
  entityId: string;
  forecastsCreated: number;
  insightsCreated: number;
  items: ForecastSummary[];
  updatedAt: string;
}

export interface EntityForecastsPayload {
  entityType: string;
  entityId: string;
  items: ForecastSummary[];
  lastRunAt: string | null;
  updatedAt: string;
}

export interface PlatformForecastRollupEntry {
  metric: ForecastMetric;
  label: string;
  horizon30: ForecastSnapshotSummary | null;
  horizon90: ForecastSnapshotSummary | null;
}

export interface PlatformForecastRollupPayload {
  entityType: string;
  entityId: string;
  rollups: PlatformForecastRollupEntry[];
  lastRunAt: string | null;
  updatedAt: string;
}

export interface InsightActionSummary {
  id: string;
  actionType: string;
  status: InsightActionStatus;
  executedAt: string | null;
}

export interface InsightSummary {
  id: string;
  entityType: string;
  entityId: string;
  category: string;
  title: string;
  severity: InsightSeverity;
  payload: Record<string, unknown>;
  actions: InsightActionSummary[];
  createdAt: string;
}

export interface InsightsFeedPayload {
  items: InsightSummary[];
  updatedAt: string;
}

export interface InsightActionExecutePayload {
  insightId: string;
  actionType: string;
  status: InsightActionStatus;
  executedStub: string;
  updatedAt: string;
}

export type CopilotIntent =
  | 'artists_at_risk'
  | 'communities_growing'
  | 'opportunities_for_me'
  | 'collaboration_matches'
  | 'revenue_forecast'
  | 'fallback';

export interface CopilotSourceRef {
  label: string;
  route: string;
  agentSlug?: string | null;
}

export interface CopilotTableColumn {
  key: string;
  label: string;
}

export interface CopilotDataTable {
  columns: CopilotTableColumn[];
  rows: Record<string, unknown>[];
}

export interface CopilotQueryPayload {
  answer: string;
  intent: CopilotIntent;
  message: string;
  taskId: string | null;
  sessionId: string | null;
  data: {
    table?: CopilotDataTable;
    summary?: Record<string, unknown>;
  };
  sources: CopilotSourceRef[];
  suggestedFollowUps: string[];
  llmHook?: 'stub' | 'disabled';
  updatedAt: string;
}

export interface CopilotSuggestionItem {
  prompt: string;
  intent: CopilotIntent;
  label: string;
}

export interface CopilotSuggestionsPayload {
  items: CopilotSuggestionItem[];
  updatedAt: string;
}

export interface CopilotFeedbackPayload {
  status: 'recorded';
  rating: 'up' | 'down';
  taskId: string | null;
  recordedStub: string;
  updatedAt: string;
}

export type AutonomousWorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AutonomousWorkflowStepLogEntry {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed' | 'awaiting_approval';
  startedAt: string | null;
  completedAt: string | null;
  output: Record<string, unknown>;
  error?: string;
}

export interface AutonomousWorkflowSummary {
  id: string;
  slug: string;
  name: string;
  triggerType: string;
  status: string;
  stepCount: number;
  createdAt: string;
}

export interface AutonomousWorkflowRunSummary {
  id: string;
  workflowId: string;
  workflowSlug: string;
  workflowName: string;
  status: AutonomousWorkflowRunStatus;
  currentStep: number;
  stepsLog: AutonomousWorkflowStepLogEntry[];
  startedAt: string;
  completedAt: string | null;
  approvedAt: string | null;
  result: Record<string, unknown>;
}

export interface AutonomousWorkflowRunPayload {
  run: AutonomousWorkflowRunSummary;
  awaitingApproval: boolean;
  approvalGate: 'start' | 'before_step' | 'end' | null;
  nextStep: string | null;
  updatedAt: string;
}

export interface AutonomousWorkflowCatalogPayload {
  items: Array<{
    slug: string;
    name: string;
    triggerType: string;
    description: string;
    stepCount: number;
  }>;
  updatedAt: string;
}

export interface CommandCenterV5WorkflowBlock {
  pendingDecisionsCount: number;
  activeRunsCount: number;
  recentRuns: AutonomousWorkflowRunSummary[];
}

export interface CommandCenterV5ActionableInsight {
  id: string;
  category: string;
  title: string;
  severity: string;
  actionType: string | null;
  actionLabel: string | null;
  executed: boolean;
}

export interface CommandCenterV5Payload {
  period: 'weekly' | 'monthly';
  audienceKpis: Record<string, unknown>;
  insights: Record<string, unknown>;
  actionableInsights: CommandCenterV5ActionableInsight[];
  workflows: CommandCenterV5WorkflowBlock;
  topOpportunities: Record<string, unknown>[];
  artistsAtRisk: Record<string, unknown>[];
  citiesHeatingUp: Record<string, unknown>[];
  communitiesGrowingFast: Record<string, unknown>[];
  revenueForecast: Record<string, unknown>;
  bookingDemandForecast: Record<string, unknown>;
  executive: Record<string, unknown>;
  participation: Record<string, unknown>;
  v3: Record<string, unknown>;
  updatedAt: string;
}
