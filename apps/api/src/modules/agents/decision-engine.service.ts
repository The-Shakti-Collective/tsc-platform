import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  AgentDecisionPayload,
  AgentDecisionSummary,
  AgentRecommendationSummary,
} from '@tsc/types';
import type {
  RecordAgentDecisionInput,
  RecordAgentRecommendationInput,
} from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import { AgentsRepository } from './agents.repository';

@Injectable()
export class DecisionEngineService {
  private readonly logger = new Logger(DecisionEngineService.name);

  constructor(
    private readonly repository: AgentsRepository,
    private readonly activityService: ActivityService,
  ) {}

  async recordRecommendation(
    input: RecordAgentRecommendationInput,
    actorPersonId?: string | null,
  ): Promise<AgentRecommendationSummary> {
    this.assertAvailable();

    const row = await this.repository.createRecommendation(input);
    if (!row) {
      throw new ServiceUnavailableException('AgentRecommendation model unavailable');
    }

    await this.stubAutomationOnRecommendation(row.id);

    if (actorPersonId) {
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'agent_recommendation_created',
        targetType: 'AgentRecommendation',
        targetId: row.id,
        metadata: {
          agentId: row.agentId,
          agentSlug: row.agent?.slug ?? null,
          artistId: row.targetArtistId,
          opportunityId:
            typeof parseMetadata(row.metadata).opportunityId === 'string'
              ? String(parseMetadata(row.metadata).opportunityId)
              : null,
          title: row.title,
          score: row.score,
          confidence: row.confidence,
        },
        visibility: 'private',
      });
    }

    return this.toRecommendationSummary(row);
  }

  async recordDecision(input: RecordAgentDecisionInput): Promise<AgentDecisionSummary> {
    this.assertAvailable();

    const row = await this.repository.createDecision(input);
    if (!row) {
      throw new ServiceUnavailableException('AgentDecision model unavailable');
    }

    return this.toDecisionSummary(row);
  }

  async approveDecision(id: string): Promise<AgentDecisionPayload> {
    return this.updateDecisionStatus(id, 'approved');
  }

  async rejectDecision(id: string): Promise<AgentDecisionPayload> {
    return this.updateDecisionStatus(id, 'rejected');
  }

  private async updateDecisionStatus(
    id: string,
    status: 'approved' | 'rejected',
  ): Promise<AgentDecisionPayload> {
    this.assertAvailable();

    const existing = await this.repository.findDecision(id);
    if (!existing) throw new NotFoundException(`Agent decision ${id} not found`);
    if (existing.status !== 'pending') {
      throw new NotFoundException(`Decision ${id} is already ${existing.status}`);
    }

    const row = await this.repository.updateDecisionStatus(id, status);
    if (!row) {
      throw new ServiceUnavailableException('AgentDecision model unavailable');
    }

    return {
      decision: this.toDecisionSummary(row),
      updatedAt: new Date().toISOString(),
    };
  }

  toRecommendationSummary(row: {
    id: string;
    agentId: string;
    targetPersonId: string | null;
    targetArtistId: string | null;
    title: string;
    rationale: string;
    score: number;
    confidence: number;
    status: string;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    agent?: { slug: string; name: string; type: string };
  }): AgentRecommendationSummary {
    return {
      id: row.id,
      agentId: row.agentId,
      agentSlug: row.agent?.slug ?? null,
      agentName: row.agent?.name ?? null,
      agentType: (row.agent?.type as AgentRecommendationSummary['agentType']) ?? null,
      targetPersonId: row.targetPersonId,
      targetArtistId: row.targetArtistId,
      title: row.title,
      rationale: row.rationale,
      score: row.score,
      confidence: row.confidence,
      status: row.status as AgentRecommendationSummary['status'],
      metadata: parseMetadata(row.metadata),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  toDecisionSummary(row: {
    id: string;
    agentId: string;
    entityType: string;
    entityId: string;
    decisionType: string;
    payload: unknown;
    confidence: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): AgentDecisionSummary {
    return {
      id: row.id,
      agentId: row.agentId,
      entityType: row.entityType,
      entityId: row.entityId,
      decisionType: row.decisionType,
      payload: parseMetadata(row.payload),
      confidence: row.confidence,
      status: row.status as AgentDecisionSummary['status'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Phase 9 Step 8 — recommendations from agents may fan out to Automation V2 evaluate (artist-scoped). */
  private async stubAutomationOnRecommendation(recommendationId: string): Promise<void> {
    this.logger.debug(
      `Automation V2 wired: recommendation ${recommendationId} may trigger evaluate/artist on cron`,
    );
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Decision Layer models unavailable');
    }
  }
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
