import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AUTOMATION_DEFAULT_THRESHOLDS,
  AUTOMATION_V2_TRIGGER_TYPES,
  type AutomationV2TriggerTypeValue,
} from '@tsc/database';
import { ActivityService } from '../activity/activity.service';
import { DecisionEngineService } from '../agents/decision-engine.service';
import { OpportunityGenerationService } from '../agents/opportunity-generation.service';
import { AutomationEngineV2Repository } from './automation-engine-v2.repository';
import type {
  AutomationEvaluatePayload,
  AutomationEvaluateResultItem,
  AutomationRunDto,
  AutomationStepRecord,
} from './types';

type RuleRow = {
  id: string;
  name: string;
  workflowType: string;
  triggerType: string;
  trigger: unknown;
  steps: unknown;
  metadata: unknown;
};

type MatchContext = {
  artistId?: string;
  entityType: string;
  entityId: string;
  signal: Record<string, unknown>;
};

@Injectable()
export class AutomationEngineV2Service {
  constructor(
    private readonly repository: AutomationEngineV2Repository,
    private readonly decisionEngine: DecisionEngineService,
    private readonly activityService: ActivityService,
    private readonly opportunityGeneration: OpportunityGenerationService,
  ) {}

  async evaluateAll(actorPersonId?: string | null): Promise<AutomationEvaluatePayload> {
    this.assertAvailable();
    await this.repository.ensureSeedRules();

    const rules = await this.repository.listActiveV2Rules();
    const items: AutomationEvaluateResultItem[] = [];

    for (const rule of rules) {
      const matches = await this.findMatches(rule);
      for (const match of matches) {
        items.push(await this.fireRule(rule, match, actorPersonId));
      }
    }

    return this.buildEvaluatePayload(items);
  }

  async evaluateArtist(
    artistId: string,
    actorPersonId?: string | null,
  ): Promise<AutomationEvaluatePayload> {
    this.assertAvailable();

    const artist = await this.repository.findArtist(artistId);
    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);

    await this.repository.ensureSeedRules();
    const rules = await this.repository.listActiveV2Rules();
    const items: AutomationEvaluateResultItem[] = [];

    for (const rule of rules) {
      const matches = await this.findMatches(rule, artistId);
      for (const match of matches) {
        items.push(await this.fireRule(rule, match, actorPersonId ?? artist.personId));
      }
    }

    return this.buildEvaluatePayload(items, artistId);
  }

  async evaluateRule(
    ruleId: string,
    actorPersonId?: string | null,
    payload?: Record<string, unknown>,
  ): Promise<AutomationEvaluatePayload> {
    this.assertAvailable();

    const rule = await this.repository.findRuleById(ruleId);
    if (!rule) throw new NotFoundException(`Automation rule ${ruleId} not found`);

    const artistId =
      typeof payload?.artistId === 'string' ? payload.artistId : undefined;
    const matches = await this.findMatches(rule, artistId);
    const items: AutomationEvaluateResultItem[] = [];

    for (const match of matches) {
      items.push(await this.fireRule(rule, match, actorPersonId));
    }

    return this.buildEvaluatePayload(items, artistId);
  }

  async listRecentRuns(limit = 20): Promise<AutomationRunDto[]> {
    this.assertAvailable();
    const rows = await this.repository.listRecentRuns(limit);
    return rows.map((row) => this.toRunDto(row));
  }

  private async findMatches(rule: RuleRow, artistId?: string): Promise<MatchContext[]> {
    const trigger = parseJsonRecord(rule.trigger);
    const triggerType = (rule.triggerType ??
      trigger.type ??
      rule.workflowType) as AutomationV2TriggerTypeValue;

    if (!(AUTOMATION_V2_TRIGGER_TYPES as readonly string[]).includes(triggerType)) {
      return [];
    }

    switch (triggerType) {
      case 'health_below':
        return this.matchHealthBelow(trigger, artistId);
      case 'churn_above':
        return this.matchChurnAbove(trigger, artistId);
      case 'deal_stale':
        return this.matchDealStale(trigger, artistId);
      case 'superfan_drop':
        return this.matchSuperfanDrop(trigger, artistId);
      default:
        return [];
    }
  }

  private async matchHealthBelow(
    trigger: Record<string, unknown>,
    artistId?: string,
  ): Promise<MatchContext[]> {
    const threshold =
      typeof trigger.threshold === 'number'
        ? trigger.threshold
        : AUTOMATION_DEFAULT_THRESHOLDS.healthBelow;

    const rows = await this.repository.listLowHealthArtists(threshold, artistId);
    return rows.map((row) => ({
      artistId: row.artistId,
      entityType: 'Artist',
      entityId: row.artistId,
      signal: {
        healthScore: row.healthScore,
        threshold,
        snapshotDate: row.snapshotDate.toISOString().slice(0, 10),
      },
    }));
  }

  private async matchChurnAbove(
    trigger: Record<string, unknown>,
    artistId?: string,
  ): Promise<MatchContext[]> {
    const threshold =
      typeof trigger.threshold === 'number'
        ? trigger.threshold
        : AUTOMATION_DEFAULT_THRESHOLDS.churnAbove;

    const rows = await this.repository.listHighChurnArtists(threshold, artistId);
    return rows.map((row) => ({
      artistId: row.artistId,
      entityType: 'Artist',
      entityId: row.artistId,
      signal: {
        audienceChurn: row.audienceChurn,
        threshold,
        snapshotDate: row.snapshotDate.toISOString().slice(0, 10),
      },
    }));
  }

  private async matchDealStale(
    trigger: Record<string, unknown>,
    artistId?: string,
  ): Promise<MatchContext[]> {
    const staleDays =
      typeof trigger.staleDays === 'number'
        ? trigger.staleDays
        : AUTOMATION_DEFAULT_THRESHOLDS.dealStaleDays;
    const status = typeof trigger.status === 'string' ? trigger.status : 'negotiation';

    const rows = await this.repository.listStaleDeals(staleDays, status, artistId);
    return rows.map((row) => ({
      artistId: row.artistId,
      entityType: 'Deal',
      entityId: row.id,
      signal: {
        dealId: row.id,
        artistId: row.artistId,
        status: row.status,
        staleDays,
        updatedAt: row.updatedAt.toISOString(),
      },
    }));
  }

  private async matchSuperfanDrop(
    trigger: Record<string, unknown>,
    artistId?: string,
  ): Promise<MatchContext[]> {
    const dropPercent =
      typeof trigger.dropPercent === 'number'
        ? trigger.dropPercent
        : AUTOMATION_DEFAULT_THRESHOLDS.superfanDropPercent;
    const tiers = Array.isArray(trigger.tiers)
      ? trigger.tiers.filter((value): value is string => typeof value === 'string')
      : ['gold', 'platinum', 'legend'];

    const rows = await this.repository.detectSuperfanDrop(artistId, dropPercent, tiers);
    return rows.map((row) => ({
      artistId: row.artistId,
      entityType: 'Artist',
      entityId: row.artistId,
      signal: {
        previousSuperfans: row.previous,
        currentSuperfans: row.current,
        dropPercent: row.dropPct,
        threshold: dropPercent,
        tiers,
      },
    }));
  }

  private async fireRule(
    rule: RuleRow,
    match: MatchContext,
    actorPersonId?: string | null,
  ): Promise<AutomationEvaluateResultItem> {
    const steps: AutomationStepRecord[] = [];
    const result: Record<string, unknown> = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: rule.triggerType,
      entityType: match.entityType,
      entityId: match.entityId,
      signal: match.signal,
      insightId: null,
      recommendationId: null,
      decisionId: null,
    };

    const run = await this.repository.createRun({
      ruleId: rule.id,
      trigger: {
        evaluation: 'v2',
        ruleName: rule.name,
        triggerType: rule.triggerType,
        ...match.signal,
      },
    });

    if (!run) {
      throw new ServiceUnavailableException('AutomationRun model unavailable');
    }

    steps.push(this.step('evaluate', `Rule matched: ${rule.name}`, match.signal));

    try {
      const agent = await this.repository.ensureAutomationAgent();
      const actionSteps = Array.isArray(rule.steps)
        ? (rule.steps as Array<Record<string, unknown>>)
        : [];

      for (const actionStep of actionSteps) {
        await this.executeAction(actionStep, rule, match, agent?.id ?? null, steps, result);
      }

      const completed = await this.repository.completeRun(run.id, {
        status: 'completed',
        steps,
        result,
      });

      await this.activityService.recordInternal({
        actorPersonId: actorPersonId ?? null,
        action: 'automation_rule_evaluated',
        targetType: 'AutomationRun',
        targetId: run.id,
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          triggerType: rule.triggerType,
          entityType: match.entityType,
          entityId: match.entityId,
          matched: true,
        },
        visibility: 'private',
      });

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggerType: rule.triggerType,
        matched: true,
        entityType: match.entityType,
        entityId: match.entityId,
        run: this.toRunDto(completed ?? run),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Automation V2 failed';
      const failed = await this.repository.completeRun(run.id, {
        status: 'failed',
        steps,
        result: { ...result, error: message },
        errorMessage: message,
      });

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggerType: rule.triggerType,
        matched: true,
        entityType: match.entityType,
        entityId: match.entityId,
        run: this.toRunDto(failed ?? run),
        error: message,
      };
    }
  }

  private async executeAction(
    actionStep: Record<string, unknown>,
    rule: RuleRow,
    match: MatchContext,
    agentId: string | null,
    steps: AutomationStepRecord[],
    result: Record<string, unknown>,
  ): Promise<void> {
    const action = typeof actionStep.action === 'string' ? actionStep.action : 'unknown';

    switch (action) {
      case 'create_alert':
      case 'create_insight': {
        const severity = normalizeSeverity(actionStep.severity);
        const category =
          typeof actionStep.category === 'string' ? actionStep.category : 'automation';
        const title =
          typeof actionStep.title === 'string'
            ? actionStep.title
            : `${rule.name} — ${match.entityType} ${match.entityId}`;

        const insight = await this.repository.createInsight({
          entityType: match.entityType,
          entityId: match.entityId,
          category,
          title,
          severity,
          payload: {
            automationRuleId: rule.id,
            triggerType: rule.triggerType,
            signal: match.signal,
          },
        });

        result.insightId = insight?.id ?? null;
        steps.push(
          this.step(action, insight ? `Insight ${insight.id} created` : 'Insight stubbed', {
            insightId: insight?.id ?? null,
            severity,
          }),
        );
        break;
      }

      case 'recommend_opportunities':
      case 're_engagement_suggestion': {
        if (!agentId) {
          steps.push(this.step(action, 'AgentRecommendation stubbed — agent unavailable', {}));
          break;
        }

        const recommendation = await this.decisionEngine.recordRecommendation(
          {
            agentId,
            targetArtistId: match.artistId ?? match.entityId,
            title:
              action === 're_engagement_suggestion'
                ? 'Re-engage superfans after drop'
                : 'Review recommended opportunities',
            rationale:
              action === 're_engagement_suggestion'
                ? `Superfan count dropped ${match.signal.dropPercent ?? 'significantly'}% — suggest re-engagement campaign.`
                : `Artist health ${match.signal.healthScore ?? 'low'} — review open opportunities.`,
            score: action === 're_engagement_suggestion' ? 72 : 68,
            confidence: 0.74,
            status: 'active',
            metadata: {
              source: 'automation_v2',
              ruleId: rule.id,
              triggerType: rule.triggerType,
              signal: match.signal,
            },
          },
          null,
        );

        result.recommendationId = recommendation.id;
        steps.push(
          this.step(action, `Recommendation ${recommendation.id} created`, {
            recommendationId: recommendation.id,
          }),
        );
        break;
      }

      case 'career_agent_run_stub':
        steps.push(
          this.step(
            action,
            'Career Agent run stubbed (cron would invoke POST /agents/career/run)',
            {
              artistId: match.artistId ?? match.entityId,
              stub: true,
            },
          ),
        );
        await this.activityService.recordInternal({
          actorPersonId: null,
          action: 'automation_action_stubbed',
          targetType: 'Artist',
          targetId: match.artistId ?? match.entityId,
          metadata: {
            action,
            ruleId: rule.id,
            message: 'Career Agent run deferred to manual/cron trigger',
          },
          visibility: 'private',
        });
        break;

      case 'trigger_opportunity_generation_stub': {
        const stub = await this.opportunityGeneration.stubRunOnInsightMatch(
          {
            ...match.signal,
            entityType: match.entityType,
            entityId: match.entityId,
            cityHeat: match.signal.cityHeat ?? match.signal.audienceGrowth,
            communityGrowth: match.signal.communityGrowth ?? match.signal.memberGrowth,
          },
          null,
        );
        steps.push(
          this.step(action, 'Opportunity generation run stubbed on insight match', stub),
        );
        break;
      }

      case 'notify_manager':
      case 'notify_stub': {
        const requiresApproval = actionStep.requiresApproval === true;
        steps.push(
          this.step(action, `${action} logged (email/task stub)`, {
            channel: actionStep.channel ?? 'email',
            stub: true,
          }),
        );

        if (requiresApproval && agentId) {
          const decision = await this.decisionEngine.recordDecision({
            agentId,
            entityType: match.entityType,
            entityId: match.entityId,
            decisionType: 'automation_notify',
            payload: {
              ruleId: rule.id,
              ruleName: rule.name,
              action,
              signal: match.signal,
              channel: actionStep.channel ?? 'email',
            },
            confidence: 0.8,
            status: 'pending',
          });
          result.decisionId = decision.id;
          steps.push(
            this.step('decision_pending', `Decision ${decision.id} awaiting approval`, {
              decisionId: decision.id,
            }),
          );
        }

        await this.activityService.recordInternal({
          actorPersonId: null,
          action: 'automation_action_stubbed',
          targetType: match.entityType,
          targetId: match.entityId,
          metadata: {
            action,
            ruleId: rule.id,
            channel: actionStep.channel ?? 'email',
            requiresApproval,
          },
          visibility: 'private',
        });
        break;
      }

      default:
        steps.push(this.step(action, `Unknown action "${action}" skipped`, actionStep));
    }
  }

  private buildEvaluatePayload(
    items: AutomationEvaluateResultItem[],
    artistId?: string,
  ): AutomationEvaluatePayload {
    return {
      scope: artistId ? 'artist' : 'platform',
      artistId: artistId ?? null,
      evaluatedAt: new Date().toISOString(),
      rulesChecked: AUTOMATION_V2_TRIGGER_TYPES.length,
      matches: items.length,
      fired: items.filter((item) => item.matched && !item.error).length,
      results: items,
      stubbed: true,
    };
  }

  private step(
    step: string,
    summary: string,
    metadata?: Record<string, unknown>,
  ): AutomationStepRecord {
    return {
      step,
      status: 'completed',
      summary,
      at: new Date().toISOString(),
      metadata,
    };
  }

  private toRunDto(row: {
    id: string;
    ruleId: string | null;
    status: string;
    trigger: unknown;
    steps: unknown;
    result: unknown;
    opportunityId?: string | null;
    personId?: string | null;
    communityId?: string | null;
    errorMessage?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    createdAt: Date;
    rule?: {
      id: string;
      name: string;
      triggerType: string;
      workflowType: string;
    } | null;
  }): AutomationRunDto {
    return {
      id: row.id,
      ruleId: row.ruleId,
      ruleName: row.rule?.name ?? null,
      triggerType: row.rule?.triggerType ?? null,
      status: row.status,
      trigger: parseJsonRecord(row.trigger),
      steps: Array.isArray(row.steps)
        ? (row.steps as AutomationStepRecord[])
        : [],
      result: parseJsonRecord(row.result),
      opportunityId: row.opportunityId ?? null,
      personId: row.personId ?? null,
      communityId: row.communityId ?? null,
      errorMessage: row.errorMessage ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Automation V2 models unavailable');
    }
  }
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeSeverity(value: unknown): 'info' | 'warning' | 'critical' {
  if (value === 'critical' || value === 'high') return 'critical';
  if (value === 'warning' || value === 'medium') return 'warning';
  return 'info';
}
