import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AutomationRule, AutomationRun } from '@tsc/database';
import { AutomationRepository } from './automation.repository';
import type {
  AutomationRuleCreateInput,
  AutomationRuleListQuery,
  AutomationRuleUpdateInput,
  AutomationTriggerInput,
} from './dto';
import type {
  AutomationRuleDto,
  AutomationRunDto,
  AutomationStepRecord,
  AutomationTriggerResult,
  AutomationWorkflowType,
} from './types';

@Injectable()
export class AutomationService {
  constructor(private readonly automationRepository: AutomationRepository) {}

  async listRules(query: AutomationRuleListQuery): Promise<AutomationRuleDto[]> {
    const rows = await this.automationRepository.listRules(query);
    return rows.map((row) => this.toRuleDto(row));
  }

  async getRule(id: string): Promise<AutomationRuleDto> {
    const row = await this.automationRepository.findRule(id);
    if (!row) {
      throw new NotFoundException(`Automation rule ${id} not found`);
    }
    return this.toRuleDto(row);
  }

  async createRule(input: AutomationRuleCreateInput): Promise<AutomationRuleDto> {
    const row = await this.automationRepository.createRule(input);
    return this.toRuleDto(row);
  }

  async updateRule(
    id: string,
    input: AutomationRuleUpdateInput,
  ): Promise<AutomationRuleDto> {
    await this.getRule(id);
    const row = await this.automationRepository.updateRule(id, input);
    return this.toRuleDto(row);
  }

  async deleteRule(id: string): Promise<{ success: true }> {
    await this.getRule(id);
    await this.automationRepository.deleteRule(id);
    return { success: true };
  }

  async trigger(input: AutomationTriggerInput): Promise<AutomationTriggerResult> {
    if (input.ruleId) {
      await this.getRule(input.ruleId);
    }

    const run = await this.automationRepository.createRun({
      ruleId: input.ruleId ?? null,
      trigger: {
        workflowType: input.workflowType,
        payload: input.payload ?? {},
      },
      personId: input.personId ?? null,
      communityId: input.communityId ?? null,
      opportunityId: input.opportunityId ?? null,
    });

    const steps: AutomationStepRecord[] = [];

    try {
      const result = await this.executeWorkflow(
        input.workflowType,
        input,
        steps,
      );

      const completed = await this.automationRepository.completeRun(run.id, {
        status: 'completed',
        steps,
        result,
        opportunityId: typeof result.opportunityId === 'string' ? result.opportunityId : input.opportunityId ?? null,
        personId: typeof result.personId === 'string' ? result.personId : input.personId ?? null,
        communityId: typeof result.communityId === 'string' ? result.communityId : input.communityId ?? null,
      });

      return {
        run: this.toRunDto(completed),
        workflowType: input.workflowType,
        stubbed: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Automation failed';
      const failed = await this.automationRepository.completeRun(run.id, {
        status: 'failed',
        steps,
        result: { error: message },
        errorMessage: message,
        personId: input.personId ?? null,
        communityId: input.communityId ?? null,
        opportunityId: input.opportunityId ?? null,
      });

      return {
        run: this.toRunDto(failed),
        workflowType: input.workflowType,
        stubbed: true,
      };
    }
  }

  private async executeWorkflow(
    workflowType: AutomationWorkflowType,
    input: AutomationTriggerInput,
    steps: AutomationStepRecord[],
  ): Promise<Record<string, unknown>> {
    switch (workflowType) {
      case 'artist_path':
        return this.runArtistPath(input, steps);
      case 'booking_inquiry':
        return this.runBookingInquiry(input, steps);
      case 'workshop_lead':
        return this.runWorkshopLead(input, steps);
      default:
        throw new Error(`Unsupported workflow type: ${workflowType}`);
    }
  }

  private async runArtistPath(
    input: AutomationTriggerInput,
    steps: AutomationStepRecord[],
  ): Promise<Record<string, unknown>> {
    const payload = input.payload ?? {};
    const personId = input.personId ?? (payload.personId as string | undefined);
    const artistId = input.artistId ?? (payload.artistId as string | undefined);

    steps.push(this.step('submission', 'Artist path submission received', { payload }));

    const scoreTier =
      typeof payload.scoreTier === 'string'
        ? payload.scoreTier
        : typeof payload.score === 'number' && payload.score >= 70
          ? 'hot'
          : typeof payload.score === 'number' && payload.score >= 40
            ? 'warm'
            : 'cold';

    if (personId) {
      await this.automationRepository.createLeadScore({
        personId,
        tier: scoreTier as 'hot' | 'warm' | 'cold',
        confidence: typeof payload.score === 'number' ? payload.score / 100 : 0.6,
        factors: {
          source: 'artist_path',
          submission: payload,
        },
      });
    }

    steps.push(
      this.step('score', `Lead scored as ${scoreTier}`, {
        personId: personId ?? null,
        tier: scoreTier,
      }),
    );

    const assigneeId =
      (payload.assigneeId as string | undefined) ??
      (payload.assignedToId as string | undefined) ??
      null;

    steps.push(
      this.step('assign', assigneeId ? `Assigned to ${assigneeId}` : 'Assignment stubbed', {
        assigneeId,
      }),
    );

    steps.push(
      this.step('task', 'Follow-up task queued (stub)', {
        taskType: 'artist_path_review',
        dueInDays: 2,
      }),
    );

    steps.push(
      this.step('follow-up', 'Follow-up reminder scheduled (stub)', {
        channel: 'email',
        template: 'artist_path_follow_up',
      }),
    );

    return {
      workflowType: 'artist_path',
      personId: personId ?? null,
      artistId: artistId ?? null,
      assigneeId,
      scoreTier,
      stubbed: true,
    };
  }

  private async runBookingInquiry(
    input: AutomationTriggerInput,
    steps: AutomationStepRecord[],
  ): Promise<Record<string, unknown>> {
    const payload = input.payload ?? {};
    const artistId = input.artistId ?? (payload.artistId as string | undefined);
    const personId = input.personId ?? (payload.personId as string | undefined);

    steps.push(this.step('inquiry', 'Booking inquiry captured', { payload }));

    const matchScore =
      typeof payload.matchScore === 'number' ? payload.matchScore : 0.82;
    steps.push(
      this.step('match', 'Artist/venue match computed (stub)', {
        artistId: artistId ?? null,
        matchScore,
      }),
    );

    const quotedValue =
      typeof payload.budget === 'number'
        ? payload.budget
        : typeof payload.value === 'number'
          ? payload.value
          : 75000;

    steps.push(
      this.step('pricing', 'Pricing estimate generated (stub)', {
        currency: 'INR',
        value: quotedValue,
      }),
    );

    const title =
      (payload.title as string | undefined) ??
      `Booking inquiry${artistId ? ` — artist ${artistId}` : ''}`;

    const opportunity = await this.automationRepository.createOpportunity({
      title,
      source: 'booking_inquiry',
      artistId: artistId ?? null,
      assignedToId: personId ?? null,
      value: quotedValue,
      metadata: {
        automation: 'booking_inquiry',
        matchScore,
        inquiry: payload,
      },
    });

    await this.automationRepository.createOpportunityActivity({
      opportunityId: opportunity.id,
      type: 'automation',
      summary: 'Booking inquiry automation created opportunity',
      actorId: personId ?? null,
      metadata: { workflowType: 'booking_inquiry' },
    });

    steps.push(
      this.step('opportunity', `Opportunity ${opportunity.id} created`, {
        opportunityId: opportunity.id,
      }),
    );

    const assigneeId =
      (payload.assigneeId as string | undefined) ??
      (payload.assignedToId as string | undefined) ??
      personId ??
      null;

    steps.push(
      this.step('assign', assigneeId ? `Assigned to ${assigneeId}` : 'Assignment stubbed', {
        assigneeId,
        opportunityId: opportunity.id,
      }),
    );

    return {
      workflowType: 'booking_inquiry',
      opportunityId: opportunity.id,
      personId: personId ?? null,
      artistId: artistId ?? null,
      assigneeId,
      quotedValue,
      stubbed: true,
    };
  }

  private async runWorkshopLead(
    input: AutomationTriggerInput,
    steps: AutomationStepRecord[],
  ): Promise<Record<string, unknown>> {
    const payload = input.payload ?? {};
    const personId = input.personId ?? (payload.personId as string | undefined);
    const communityId =
      input.communityId ?? (payload.communityId as string | undefined);

    const purchaseAmount =
      typeof payload.amount === 'number'
        ? payload.amount
        : typeof payload.purchaseAmount === 'number'
          ? payload.purchaseAmount
          : null;

    steps.push(
      this.step('purchase', 'Workshop purchase recorded (stub)', {
        amount: purchaseAmount,
        productId: payload.productId ?? null,
      }),
    );

    if (personId) {
      const person = await this.automationRepository.findPerson(personId);
      if (!person) {
        throw new NotFoundException(`Person ${personId} not found`);
      }
      steps.push(this.step('person', `Person ${personId} linked`, { personId }));
    } else {
      steps.push(
        this.step('person', 'Person lookup skipped — provide personId', {
          personId: null,
        }),
      );
    }

    if (communityId) {
      const community = await this.automationRepository.findCommunity(communityId);
      if (!community) {
        throw new NotFoundException(`Community ${communityId} not found`);
      }
      if (personId) {
        await this.automationRepository.ensureCommunityMember(communityId, personId);
      }
      steps.push(
        this.step('community', `Community ${communityId} linked`, {
          communityId,
          memberLinked: Boolean(personId),
        }),
      );
    } else {
      steps.push(
        this.step('community', 'Community lookup skipped — provide communityId', {
          communityId: null,
        }),
      );
    }

    const recommendedWorkshopId =
      (payload.workshopId as string | undefined) ??
      (payload.recommendedWorkshopId as string | undefined) ??
      'workshop-stub-next-level';

    steps.push(
      this.step('recommend_workshop', 'Workshop recommendation generated (stub)', {
        recommendedWorkshopId,
        reason: 'prior_purchase_affinity',
      }),
    );

    return {
      workflowType: 'workshop_lead',
      personId: personId ?? null,
      communityId: communityId ?? null,
      recommendedWorkshopId,
      purchaseAmount,
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

  private toRuleDto(row: AutomationRule): AutomationRuleDto {
    return {
      id: row.id,
      name: row.name,
      workflowType: row.workflowType,
      triggerType: (row as AutomationRule & { triggerType?: string }).triggerType ?? row.workflowType,
      trigger: (row.trigger ?? {}) as Record<string, unknown>,
      steps: Array.isArray(row.steps) ? row.steps : [],
      status: row.status,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toRunDto(row: AutomationRun): AutomationRunDto {
    return {
      id: row.id,
      ruleId: row.ruleId,
      status: row.status,
      trigger: (row.trigger ?? {}) as Record<string, unknown>,
      steps: Array.isArray(row.steps)
        ? (row.steps as unknown as AutomationStepRecord[])
        : [],
      result: (row.result ?? {}) as Record<string, unknown>,
      opportunityId: row.opportunityId,
      personId: row.personId,
      communityId: row.communityId,
      errorMessage: row.errorMessage,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
