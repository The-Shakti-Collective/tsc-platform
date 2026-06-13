import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  AutonomousWorkflowStepDefinition,
  AutonomousWorkflowStepLogEntry,
} from '@tsc/database';
import { BRAND_CAMPAIGN_OUTREACH_SLUG } from '@tsc/database';
import type {
  AutonomousWorkflowCatalogPayload,
  AutonomousWorkflowRunPayload,
  AutonomousWorkflowRunSummary,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type {
  AutonomousWorkflowApproveInput,
  AutonomousWorkflowRunInput,
} from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import { BrandMatchAgentService } from './brand-match-agent.service';
import { AgentsRepository } from './agents.repository';
import {
  AutonomousWorkflowRepository,
  type WorkflowRunRow,
  type WorkflowRow,
} from './autonomous-workflow.repository';

type StepContext = {
  payload: Record<string, unknown>;
  stepsLog: AutonomousWorkflowStepLogEntry[];
  brandMatchResult?: Record<string, unknown>;
  rankedArtists?: Array<Record<string, unknown>>;
  invitationStubs?: string[];
  responseSummary?: Record<string, unknown>;
};

@Injectable()
export class AutonomousWorkflowService {
  private readonly logger = new Logger(AutonomousWorkflowService.name);

  constructor(
    private readonly repository: AutonomousWorkflowRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly brandMatchAgent: BrandMatchAgentService,
    private readonly activityService: ActivityService,
  ) {}

  async getCatalog(ctx: MembershipContext): Promise<AutonomousWorkflowCatalogPayload> {
    this.assertAdmin(ctx);
    await this.repository.ensureSeedWorkflows(ctx.personId ?? ctx.userId ?? null);
    const rows = await this.repository.listWorkflows();
    return {
      items: rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        triggerType: row.triggerType,
        description: catalogDescription(row.slug),
        stepCount: parseSteps(row.steps).length,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async runWorkflow(
    input: AutonomousWorkflowRunInput,
    ctx: MembershipContext,
  ): Promise<AutonomousWorkflowRunPayload> {
    this.assertAdmin(ctx);
    await this.repository.ensureWorkflowAgent();
    await this.repository.ensureSeedWorkflows(ctx.personId ?? ctx.userId ?? null);

    const workflow = await this.repository.findWorkflowBySlug(input.workflowSlug);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${input.workflowSlug} not found`);
    }

    const run = await this.repository.createRun(workflow.id, input.payload);
    if (!run) {
      throw new ServiceUnavailableException('Autonomous workflow storage unavailable');
    }

    await this.recordActivity(ctx, 'autonomous_workflow_started', run.id, {
      workflowSlug: workflow.slug,
      runId: run.id,
    });

    if (input.approveStart) {
      return this.advanceRun(run.id, ctx, { approvedStart: true });
    }

    const steps = parseSteps(workflow.steps);
    const firstStep = steps[0];
    if (firstStep?.type === 'gate' && firstStep.gate === 'start') {
      const paused = await this.repository.updateRun(run.id, {
        status: 'awaiting_approval',
        currentStep: 0,
        stepsLog: [
          this.logEntry(firstStep, 'awaiting_approval', {
            message: 'Awaiting human approval to start workflow',
          }),
        ],
      });
      return this.toRunPayload(paused!, workflow, true, 'start');
    }

    return this.advanceRun(run.id, ctx);
  }

  async getRun(id: string, ctx: MembershipContext): Promise<AutonomousWorkflowRunPayload> {
    this.assertAdmin(ctx);
    const run = await this.repository.findRunById(id);
    if (!run) throw new NotFoundException(`Workflow run ${id} not found`);
    const workflow = run.workflow;
    if (!workflow) throw new NotFoundException('Workflow definition missing');

    const awaiting =
      run.status === 'awaiting_approval' ||
      run.status === 'pending';
    const gate = this.detectApprovalGate(run, parseSteps(workflow.steps));
    return this.toRunPayload(run, workflow, awaiting, gate);
  }

  async approveRun(
    id: string,
    input: AutonomousWorkflowApproveInput,
    ctx: MembershipContext,
  ): Promise<AutonomousWorkflowRunPayload> {
    this.assertAdmin(ctx);
    const run = await this.repository.findRunById(id);
    if (!run) throw new NotFoundException(`Workflow run ${id} not found`);
    if (run.status !== 'awaiting_approval') {
      throw new BadRequestException(`Run ${id} is not awaiting approval (status: ${run.status})`);
    }

    await this.repository.updateRun(id, { approvedAt: new Date() });
    await this.recordActivity(ctx, 'autonomous_workflow_approved', id, {
      runId: id,
      note: input.note ?? null,
    });

    return this.advanceRun(id, ctx, { approvedGate: true });
  }

  async cancelRun(id: string, ctx: MembershipContext): Promise<AutonomousWorkflowRunPayload> {
    this.assertAdmin(ctx);
    const run = await this.repository.findRunById(id);
    if (!run) throw new NotFoundException(`Workflow run ${id} not found`);
    if (run.status === 'completed' || run.status === 'cancelled') {
      throw new BadRequestException(`Run ${id} cannot be cancelled (status: ${run.status})`);
    }

    const updated = await this.repository.updateRun(id, {
      status: 'cancelled',
      completedAt: new Date(),
    });

    await this.recordActivity(ctx, 'autonomous_workflow_cancelled', id, { runId: id });

    const workflow = updated?.workflow ?? run.workflow;
    if (!workflow) throw new NotFoundException('Workflow definition missing');
    return this.toRunPayload(updated!, workflow, false, null);
  }

  async getCommandCenterBlock(): Promise<{
    pendingDecisionsCount: number;
    activeRunsCount: number;
    recentRuns: AutonomousWorkflowRunSummary[];
  }> {
    await this.repository.ensureSeedWorkflows(null);
    const [pendingDecisionsCount, activeRunsCount, recentRuns] = await Promise.all([
      this.repository.countPendingDecisions(),
      this.repository.countActiveRuns(),
      this.repository.listRecentRuns(5),
    ]);

    return {
      pendingDecisionsCount,
      activeRunsCount,
      recentRuns: recentRuns.map((row) => this.toRunSummary(row)),
    };
  }

  private async advanceRun(
    runId: string,
    ctx: MembershipContext,
    options: { approvedStart?: boolean; approvedGate?: boolean } = {},
  ): Promise<AutonomousWorkflowRunPayload> {
    const run = await this.repository.findRunById(runId);
    if (!run?.workflow) throw new NotFoundException(`Workflow run ${runId} not found`);

    const steps = parseSteps(run.workflow.steps);
    const context: StepContext = {
      payload: parseJsonRecord(run.payload),
      stepsLog: parseStepsLog(run.stepsLog),
      ...(parseJsonRecord(run.result) as StepContext),
    };

    await this.repository.updateRun(runId, { status: 'running' });

    let stepIndex = run.currentStep;
    if (options.approvedStart) {
      const startStep = steps[0];
      if (startStep?.gate === 'start') {
        context.stepsLog.push(
          this.logEntry(startStep, 'completed', { approvedStart: true }),
        );
        stepIndex = Math.max(stepIndex, 1);
      }
    }

    for (; stepIndex < steps.length; stepIndex += 1) {
      const step = steps[stepIndex];
      if (!step) break;

      if (step.type === 'gate' && step.gate === 'start') {
        const startDone = context.stepsLog.some(
          (entry) => entry.stepId === step.id && entry.status === 'completed',
        );
        if (!startDone) {
          context.stepsLog.push(
            this.logEntry(step, 'awaiting_approval', {
              message: 'Awaiting human approval to start workflow',
            }),
          );
          const paused = await this.repository.updateRun(runId, {
            status: 'awaiting_approval',
            currentStep: stepIndex,
            stepsLog: context.stepsLog,
            result: this.contextToResult(context),
          });
          return this.toRunPayload(paused!, run.workflow, true, 'start');
        }
        continue;
      }

      if (step.requiresApproval) {
        const approved = context.stepsLog.some(
          (entry) => entry.stepId === step.id && entry.output?.approved === true,
        );
        if (!approved) {
          if (!options.approvedGate) {
            context.stepsLog.push(
              this.logEntry(step, 'awaiting_approval', {
                message: `Approval required before: ${step.name}`,
              }),
            );
            const paused = await this.repository.updateRun(runId, {
              status: 'awaiting_approval',
              currentStep: stepIndex,
              stepsLog: context.stepsLog,
              result: this.contextToResult(context),
            });
            const gate = step.gate === 'end' ? 'end' : 'before_step';
            return this.toRunPayload(paused!, run.workflow, true, gate);
          }

          context.stepsLog = context.stepsLog.map((entry) =>
            entry.stepId === step.id && entry.status === 'awaiting_approval'
              ? {
                  ...entry,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  output: { ...entry.output, approved: true },
                }
              : entry,
          );
          options.approvedGate = false;
        }
      }

      context.stepsLog.push(this.logEntry(step, 'running', {}));
      try {
        const output = await this.executeStep(step, context, ctx);
        context.stepsLog = this.completeLogEntry(context.stepsLog, step.id, output);
        await this.recordActivity(ctx, 'autonomous_workflow_step_completed', runId, {
          runId,
          stepId: step.id,
          stepName: step.name,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown';
        context.stepsLog = this.failLogEntry(context.stepsLog, step.id, message);
        const failed = await this.repository.updateRun(runId, {
          status: 'failed',
          currentStep: stepIndex,
          stepsLog: context.stepsLog,
          result: this.contextToResult(context),
          completedAt: new Date(),
        });
        return this.toRunPayload(failed!, run.workflow, false, null);
      }
    }

    const completed = await this.repository.updateRun(runId, {
      status: 'completed',
      currentStep: steps.length,
      stepsLog: context.stepsLog,
      result: this.contextToResult(context),
      completedAt: new Date(),
    });

    await this.recordActivity(ctx, 'autonomous_workflow_completed', runId, {
      runId,
      workflowSlug: run.workflow.slug,
    });

    return this.toRunPayload(completed!, run.workflow, false, null);
  }

  private async executeStep(
    step: AutonomousWorkflowStepDefinition,
    context: StepContext,
    ctx: MembershipContext,
  ): Promise<Record<string, unknown>> {
    switch (step.action) {
      case 'brand_match_run': {
        const brandId = String(context.payload.brandId ?? '');
        if (!brandId) throw new BadRequestException('payload.brandId required for brand match');
        const result = await this.brandMatchAgent.run(
          {
            brandId,
            genre: typeof context.payload.genre === 'string' ? context.payload.genre : undefined,
            city: typeof context.payload.city === 'string' ? context.payload.city : undefined,
            budget:
              typeof context.payload.budget === 'number' ? context.payload.budget : undefined,
            audienceAge:
              typeof context.payload.audienceAge === 'string'
                ? context.payload.audienceAge
                : undefined,
            limit: typeof context.payload.limit === 'number' ? context.payload.limit : 10,
          },
          ctx,
        );
        context.brandMatchResult = result as unknown as Record<string, unknown>;
        return {
          taskId: result.taskId,
          recommendationsCreated: result.recommendationsCreated,
          decisionId: result.decisionId,
        };
      }
      case 'rank_artists': {
        const items = Array.isArray(context.brandMatchResult?.items)
          ? (context.brandMatchResult.items as Array<Record<string, unknown>>)
          : [];
        context.rankedArtists = [...items].sort(
          (a, b) => Number(b.score ?? 0) - Number(a.score ?? 0),
        );
        return {
          rankedCount: context.rankedArtists.length,
          topArtistIds: context.rankedArtists.slice(0, 5).map((item) => item.targetArtistId ?? item.metadata),
        };
      }
      case 'send_invitations': {
        const artists = context.rankedArtists ?? [];
        const stubs: string[] = [];
        for (const artist of artists.slice(0, 5)) {
          const artistId = String(
            artist.targetArtistId ??
              (artist.metadata as Record<string, unknown>)?.artistId ??
              'unknown',
          );
          const recId = String(artist.id ?? 'unknown');
          stubs.push(`stub:campaign_invite brand=${context.payload.brandId} artist=${artistId} rec=${recId}`);
        }
        context.invitationStubs = stubs;
        return { invitationsQueued: stubs.length, stubs };
      }
      case 'track_responses': {
        const brandId = String(context.payload.brandId ?? '');
        const applied = await this.agentsRepository.countAppliedRecommendationsForBrand(brandId);
        context.responseSummary = {
          invited: context.invitationStubs?.length ?? 0,
          applied,
          pending: Math.max(0, (context.invitationStubs?.length ?? 0) - applied),
        };
        return context.responseSummary;
      }
      case undefined:
        if (step.type === 'report' || step.gate === 'end') {
          const report = {
            workflowSlug: BRAND_CAMPAIGN_OUTREACH_SLUG,
            brandId: context.payload.brandId ?? null,
            artistsMatched: context.rankedArtists?.length ?? 0,
            topArtists: (context.rankedArtists ?? []).slice(0, 5).map((item) => ({
              artistId: item.targetArtistId ?? null,
              score: item.score ?? null,
              title: item.title ?? null,
            })),
            invitationsSent: context.invitationStubs?.length ?? 0,
            responses: context.responseSummary ?? {},
            generatedAt: new Date().toISOString(),
          };
          return { report };
        }
        if (step.type === 'gate') {
          return { gate: step.gate ?? 'unknown' };
        }
        return { skipped: true, stepId: step.id };
      default:
        return { stub: true, action: step.action };
    }
  }

  private toRunPayload(
    run: WorkflowRunRow,
    workflow: WorkflowRow,
    awaitingApproval: boolean,
    approvalGate: 'start' | 'before_step' | 'end' | null,
  ): AutonomousWorkflowRunPayload {
    const steps = parseSteps(workflow.steps);
    const nextIndex = run.currentStep;
    const nextStep = steps[nextIndex]?.name ?? null;
    return {
      run: this.toRunSummary(run),
      awaitingApproval,
      approvalGate,
      nextStep,
      updatedAt: new Date().toISOString(),
    };
  }

  private toRunSummary(run: WorkflowRunRow): AutonomousWorkflowRunSummary {
    return {
      id: run.id,
      workflowId: run.workflowId,
      workflowSlug: run.workflow?.slug ?? '',
      workflowName: run.workflow?.name ?? '',
      status: run.status as AutonomousWorkflowRunSummary['status'],
      currentStep: run.currentStep,
      stepsLog: parseStepsLog(run.stepsLog),
      startedAt: run.startedAt.toISOString(),
      completedAt: run.completedAt?.toISOString() ?? null,
      approvedAt: run.approvedAt?.toISOString() ?? null,
      result: parseJsonRecord(run.result),
    };
  }

  private detectApprovalGate(
    run: WorkflowRunRow,
    steps: AutonomousWorkflowStepDefinition[],
  ): 'start' | 'before_step' | 'end' | null {
    if (run.status !== 'awaiting_approval') return null;
    const step = steps[run.currentStep];
    if (!step) return null;
    if (step.gate === 'start') return 'start';
    if (step.gate === 'end') return 'end';
    return 'before_step';
  }

  private logEntry(
    step: AutonomousWorkflowStepDefinition,
    status: AutonomousWorkflowStepLogEntry['status'],
    output: Record<string, unknown>,
  ): AutonomousWorkflowStepLogEntry {
    return {
      stepId: step.id,
      stepName: step.name,
      status,
      startedAt: new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      output,
    };
  }

  private completeLogEntry(
    log: AutonomousWorkflowStepLogEntry[],
    stepId: string,
    output: Record<string, unknown>,
  ): AutonomousWorkflowStepLogEntry[] {
    return log.map((entry) =>
      entry.stepId === stepId && entry.status === 'running'
        ? {
            ...entry,
            status: 'completed',
            completedAt: new Date().toISOString(),
            output: { ...entry.output, ...output },
          }
        : entry,
    );
  }

  private failLogEntry(
    log: AutonomousWorkflowStepLogEntry[],
    stepId: string,
    error: string,
  ): AutonomousWorkflowStepLogEntry[] {
    return log.map((entry) =>
      entry.stepId === stepId && entry.status === 'running'
        ? {
            ...entry,
            status: 'failed',
            completedAt: new Date().toISOString(),
            error,
          }
        : entry,
    );
  }

  private contextToResult(context: StepContext): Record<string, unknown> {
    return {
      brandMatchResult: context.brandMatchResult ?? null,
      rankedArtists: context.rankedArtists ?? [],
      invitationStubs: context.invitationStubs ?? [],
      responseSummary: context.responseSummary ?? null,
    };
  }

  private assertAdmin(ctx: MembershipContext) {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin access required for autonomous workflows');
    }
  }

  private async recordActivity(
    ctx: MembershipContext,
    action:
      | 'autonomous_workflow_started'
      | 'autonomous_workflow_step_completed'
      | 'autonomous_workflow_approved'
      | 'autonomous_workflow_completed'
      | 'autonomous_workflow_cancelled',
    targetId: string,
    metadata: Record<string, unknown>,
  ) {
    const actorPersonId = ctx.personId ?? ctx.userId;
    if (!actorPersonId) return;
    await this.activityService.recordInternal({
      actorPersonId,
      action,
      targetType: 'AutonomousWorkflowRun',
      targetId,
      metadata,
      visibility: 'private',
    });
  }
}

function parseSteps(value: unknown): AutonomousWorkflowStepDefinition[] {
  if (!Array.isArray(value)) return [];
  return value as AutonomousWorkflowStepDefinition[];
}

function parseStepsLog(value: unknown): AutonomousWorkflowStepLogEntry[] {
  if (!Array.isArray(value)) return [];
  return value as AutonomousWorkflowStepLogEntry[];
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function catalogDescription(slug: string): string {
  if (slug === BRAND_CAMPAIGN_OUTREACH_SLUG) {
    return 'Brand campaign → find artists → rank → invite (stub) → track responses → report.';
  }
  return 'Autonomous multi-step workflow';
}
