import type {
  GeneratedOpportunitySourceValue,
  GeneratedOpportunityStatusValue,
  GeneratedOpportunityTypeValue,
  OpportunityGenerationRuleId,
} from '@tsc/database';

export interface GeneratedOpportunitySummary {
  id: string;
  source: GeneratedOpportunitySourceValue;
  generationReason: string;
  signalSnapshot: Record<string, unknown>;
  suggestedType: GeneratedOpportunityTypeValue;
  title: string;
  description: string | null;
  city: string | null;
  genre: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  confidence: number;
  status: GeneratedOpportunityStatusValue;
  opportunityId: string | null;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface OpportunityGenerationRunSummary {
  id: string;
  triggeredBy: string;
  scope: Record<string, unknown>;
  signals: Record<string, unknown>;
  generatedCount: number;
  runAt: string;
}

export interface OpportunityGenerationHotSignal {
  id: string;
  ruleId: OpportunityGenerationRuleId;
  label: string;
  city: string | null;
  genre: string | null;
  audienceGrowth: number | null;
  communityActivity: number | null;
  memberGrowth: number | null;
  communityId?: string | null;
  confidence: number;
  suggestedType: GeneratedOpportunityTypeValue;
  reasonCodes: string[];
  updatedAt: string;
}

export interface OpportunityGenerationRunPayload {
  runId: string;
  triggeredBy: string;
  generatedCount: number;
  drafts: GeneratedOpportunitySummary[];
  signals: OpportunityGenerationHotSignal[];
  updatedAt: string;
}

export interface OpportunityGenerationDraftsPayload {
  items: GeneratedOpportunitySummary[];
  total: number;
  updatedAt: string;
}

export interface OpportunityGenerationSignalsPayload {
  items: OpportunityGenerationHotSignal[];
  updatedAt: string;
}

export interface OpportunityGenerationApprovePayload {
  draft: GeneratedOpportunitySummary;
  opportunityId: string;
  decisionId: string | null;
  updatedAt: string;
}

export interface OpportunityGenerationDismissPayload {
  draft: GeneratedOpportunitySummary;
  updatedAt: string;
}
