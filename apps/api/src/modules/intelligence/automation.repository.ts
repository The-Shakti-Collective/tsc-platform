import { Injectable } from '@nestjs/common';
import type { AutomationTriggerTypeValue, Prisma } from '@tsc/database';
import {
  automationRuleInclude,
  automationRunInclude,
  goalWithProgressInclude,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import { optionalPrismaClient } from '../../common/prisma/optional-client';
import type {
  AutomationRuleCreateInput,
  AutomationRuleListQuery,
  AutomationRuleUpdateInput,
  GoalCreateInput,
  GoalListQuery,
  GoalUpdateInput,
} from './dto';
import type { AutomationStepRecord } from './types';

@Injectable()
export class AutomationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listRules(query: AutomationRuleListQuery) {
    const where: Prisma.AutomationRuleWhereInput = {};
    if (query.workflowType) where.workflowType = query.workflowType;
    if (query.triggerType) where.triggerType = query.triggerType;
    if (query.status) where.status = query.status;

    return this.prisma.client.automationRule.findMany({
      where,
      take: query.limit,
      orderBy: { updatedAt: 'desc' },
      include: automationRuleInclude,
    });
  }

  findRule(id: string) {
    return this.prisma.client.automationRule.findUnique({
      where: { id },
      include: automationRuleInclude,
    });
  }

  createRule(input: AutomationRuleCreateInput) {
    const rawTrigger =
      input.triggerType ??
      (input.workflowType as 'artist_path' | 'booking_inquiry' | 'workshop_lead' | 'signal_rule');
    const triggerType: AutomationTriggerTypeValue =
      rawTrigger === 'signal_rule' ? 'workshop_lead' : rawTrigger;

    return this.prisma.client.automationRule.create({
      data: {
        id: newId(),
        name: input.name,
        workflowType: input.workflowType,
        triggerType,
        trigger: toInputJson(input.trigger),
        steps: toInputJson(input.steps ?? []),
        status: input.status ?? 'active',
        metadata: toInputJson(input.metadata),
      },
    });
  }

  updateRule(id: string, input: AutomationRuleUpdateInput) {
    return this.prisma.client.automationRule.update({
      where: { id },
      data: {
        name: input.name,
        workflowType: input.workflowType,
        triggerType: input.triggerType,
        trigger: input.trigger !== undefined ? toInputJson(input.trigger) : undefined,
        steps: input.steps !== undefined ? toInputJson(input.steps) : undefined,
        status: input.status,
        metadata: input.metadata !== undefined ? toInputJson(input.metadata) : undefined,
      },
    });
  }

  deleteRule(id: string) {
    return this.prisma.client.automationRule.delete({ where: { id } });
  }

  listRecentRuns(limit = 20) {
    return this.prisma.client.automationRun.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: automationRunInclude,
    });
  }

  createRun(input: {
    ruleId?: string | null;
    trigger: Record<string, unknown>;
    personId?: string | null;
    communityId?: string | null;
    opportunityId?: string | null;
  }) {
    return this.prisma.client.automationRun.create({
      data: {
        id: newId(),
        ruleId: input.ruleId ?? null,
        status: 'running',
        trigger: toInputJson(input.trigger),
        steps: toInputJson([]),
        result: toInputJson({}),
        personId: input.personId ?? null,
        communityId: input.communityId ?? null,
        opportunityId: input.opportunityId ?? null,
        startedAt: new Date(),
      },
    });
  }

  completeRun(
    id: string,
    data: {
      status: 'completed' | 'failed';
      steps: AutomationStepRecord[];
      result: Record<string, unknown>;
      opportunityId?: string | null;
      personId?: string | null;
      communityId?: string | null;
      errorMessage?: string | null;
    },
  ) {
    return this.prisma.client.automationRun.update({
      where: { id },
      data: {
        status: data.status,
        steps: toInputJson(data.steps),
        result: toInputJson(data.result),
        opportunityId: data.opportunityId,
        personId: data.personId,
        communityId: data.communityId,
        errorMessage: data.errorMessage ?? null,
        completedAt: new Date(),
      },
    });
  }

  findPerson(id: string) {
    return this.prisma.client.person.findUnique({ where: { id } });
  }

  findCommunity(id: string) {
    return this.prisma.client.community.findUnique({ where: { id } });
  }

  createOpportunity(data: {
    title: string;
    source: string;
    artistId?: string | null;
    organizationId?: string | null;
    assignedToId?: string | null;
    value?: number | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.opportunity.create({
      data: {
        id: newId(),
        title: data.title,
        status: 'open',
        source: data.source,
        category: 'open_call',
        organizationId: data.organizationId ?? null,
        ownerType: data.artistId ? 'artist' : null,
        ownerId: data.artistId ?? null,
        value: data.value ?? null,
        metadata: toInputJson({
          ...(data.metadata ?? {}),
          assignedToId: data.assignedToId ?? null,
        }),
      },
    });
  }

  createOpportunityActivity(data: {
    opportunityId: string;
    type: string;
    summary?: string;
    actorId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.client.opportunityActivity.create({
      data: {
        id: newId(),
        opportunityId: data.opportunityId,
        type: data.type,
        summary: data.summary ?? null,
        personId: data.actorId ?? null,
        metadata: toInputJson(data.metadata),
      },
    });
  }

  createLeadScore(data: {
    personId: string;
    opportunityId?: string | null;
    tier: 'hot' | 'warm' | 'cold';
    confidence?: number;
    factors?: Record<string, unknown>;
  }) {
    const leadScore = optionalPrismaClient<{
      create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    }>(this.prisma.client, 'leadScore');
    if (!leadScore) return Promise.resolve(null);

    return leadScore.create({
      data: {
        id: newId(),
        personId: data.personId,
        opportunityId: data.opportunityId ?? null,
        tier: data.tier,
        confidence: data.confidence ?? 0.7,
        factors: toInputJson(data.factors),
      },
    });
  }

  ensureCommunityMember(communityId: string, personId: string) {
    return this.prisma.client.communityMember.upsert({
      where: { communityId_personId: { communityId, personId } },
      create: {
        id: newId(),
        communityId,
        personId,
        role: 'Member',
      },
      update: {},
    });
  }
}

@Injectable()
export class GoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  listGoals(query: GoalListQuery) {
    const where: Prisma.GoalWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.period) where.period = query.period;

    return this.prisma.client.goal.findMany({
      where,
      take: query.limit,
      orderBy: { updatedAt: 'desc' },
      include: goalWithProgressInclude,
    });
  }

  findGoal(id: string) {
    return this.prisma.client.goal.findUnique({
      where: { id },
      include: goalWithProgressInclude,
    });
  }

  createGoal(input: GoalCreateInput) {
    return this.prisma.client.goal.create({
      data: {
        id: newId(),
        name: input.name ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        metric: input.metric,
        target: input.target,
        current: input.current ?? 0,
        period: input.period,
        periodStart: input.periodStart ? new Date(input.periodStart) : null,
        periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
        metadata: toInputJson(input.metadata),
      },
      include: goalWithProgressInclude,
    });
  }

  updateGoal(id: string, input: GoalUpdateInput) {
    return this.prisma.client.goal.update({
      where: { id },
      data: {
        name: input.name,
        entityType: input.entityType,
        entityId: input.entityId,
        metric: input.metric,
        target: input.target,
        current: input.current,
        period: input.period,
        periodStart:
          input.periodStart !== undefined
            ? input.periodStart
              ? new Date(input.periodStart)
              : null
            : undefined,
        periodEnd:
          input.periodEnd !== undefined
            ? input.periodEnd
              ? new Date(input.periodEnd)
              : null
            : undefined,
        metadata: input.metadata !== undefined ? toInputJson(input.metadata) : undefined,
      },
      include: goalWithProgressInclude,
    });
  }

  deleteGoal(id: string) {
    return this.prisma.client.goal.delete({ where: { id } });
  }

  recordProgress(
    id: string,
    current: number,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.client.goalProgress.create({
      data: {
        id: newId(),
        goalId: id,
        current,
        recordedAt: new Date(),
        metadata: toInputJson(metadata),
      },
    });
  }

  listGoalsForDashboard(entityType?: string, entityId?: string) {
    const where: Prisma.GoalWhereInput = {};
    if (entityType) where.entityType = entityType as Prisma.EnumGoalEntityTypeFilter['equals'];
    if (entityId) where.entityId = entityId;

    return this.prisma.client.goal.findMany({
      where,
      orderBy: [{ entityType: 'asc' }, { entityId: 'asc' }, { metric: 'asc' }],
      include: goalWithProgressInclude,
    });
  }
}
