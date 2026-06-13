import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  AUTONOMOUS_WORKFLOW_CATALOG,
  WORKFLOW_AGENT_SLUG,
  type AutonomousWorkflowRunStatusValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { toInputJson } from '../../common/json';

type WorkflowRow = {
  id: string;
  slug: string;
  name: string;
  triggerType: string;
  steps: Prisma.JsonValue;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type WorkflowRunRow = {
  id: string;
  workflowId: string;
  status: string;
  currentStep: number;
  stepsLog: Prisma.JsonValue;
  payload: Prisma.JsonValue;
  startedAt: Date;
  completedAt: Date | null;
  approvedAt: Date | null;
  result: Prisma.JsonValue;
  workflow?: WorkflowRow;
};

@Injectable()
export class AutonomousWorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get workflowClient() {
    return (this.prisma.client as unknown as {
      autonomousWorkflow?: {
        findUnique: (args: unknown) => Promise<WorkflowRow | null>;
        findFirst: (args: unknown) => Promise<WorkflowRow | null>;
        upsert: (args: unknown) => Promise<WorkflowRow>;
        findMany: (args: unknown) => Promise<WorkflowRow[]>;
      };
    }).autonomousWorkflow ?? null;
  }

  private get runClient() {
    return (this.prisma.client as unknown as {
      autonomousWorkflowRun?: {
        create: (args: unknown) => Promise<WorkflowRunRow>;
        findUnique: (args: unknown) => Promise<WorkflowRunRow | null>;
        update: (args: unknown) => Promise<WorkflowRunRow>;
        count: (args: unknown) => Promise<number>;
        findMany: (args: unknown) => Promise<WorkflowRunRow[]>;
      };
    }).autonomousWorkflowRun ?? null;
  }

  private get agentClient() {
    return (this.prisma.client as unknown as {
      agent?: {
        upsert: (args: unknown) => Promise<{ id: string }>;
      };
      agentDecision?: {
        count: (args: unknown) => Promise<number>;
      };
    }).agent ?? null;
  }

  async ensureWorkflowAgent(): Promise<{ id: string } | null> {
    if (!this.agentClient) return null;
    return this.agentClient.upsert({
      where: { slug: WORKFLOW_AGENT_SLUG },
      create: {
        slug: WORKFLOW_AGENT_SLUG,
        name: 'Autonomous Workflow Orchestrator',
        type: 'workflow',
        config: {},
        isActive: true,
      },
      update: { isActive: true },
    });
  }

  async ensureSeedWorkflows(createdBy?: string | null): Promise<WorkflowRow[]> {
    if (!this.workflowClient) return [];

    const rows: WorkflowRow[] = [];
    for (const definition of AUTONOMOUS_WORKFLOW_CATALOG) {
      const row = await this.workflowClient.upsert({
        where: { slug: definition.slug },
        create: {
          slug: definition.slug,
          name: definition.name,
          triggerType: definition.triggerType,
          steps: toInputJson(definition.steps),
          status: 'active',
          createdBy: createdBy ?? null,
        },
        update: {
          name: definition.name,
          triggerType: definition.triggerType,
          steps: toInputJson(definition.steps),
          status: 'active',
        },
      });
      rows.push(row);
    }
    return rows;
  }

  findWorkflowBySlug(slug: string): Promise<WorkflowRow | null> {
    if (!this.workflowClient) return Promise.resolve(null);
    return this.workflowClient.findUnique({ where: { slug } });
  }

  listWorkflows(): Promise<WorkflowRow[]> {
    if (!this.workflowClient) return Promise.resolve([]);
    return this.workflowClient.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
  }

  createRun(workflowId: string, payload: Record<string, unknown>): Promise<WorkflowRunRow | null> {
    if (!this.runClient) return Promise.resolve(null);
    return this.runClient.create({
      data: {
        workflowId,
        status: 'pending',
        currentStep: 0,
        stepsLog: [],
        payload: toInputJson(payload),
        result: {},
      },
    });
  }

  findRunById(id: string): Promise<WorkflowRunRow | null> {
    if (!this.runClient) return Promise.resolve(null);
    return this.runClient.findUnique({
      where: { id },
      include: { workflow: true },
    });
  }

  updateRun(
    id: string,
    data: {
      status?: AutonomousWorkflowRunStatusValue;
      currentStep?: number;
      stepsLog?: unknown[];
      result?: Record<string, unknown>;
      completedAt?: Date | null;
      approvedAt?: Date | null;
    },
  ): Promise<WorkflowRunRow | null> {
    if (!this.runClient) return Promise.resolve(null);
    return this.runClient.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.currentStep != null ? { currentStep: data.currentStep } : {}),
        ...(data.stepsLog ? { stepsLog: toInputJson(data.stepsLog) } : {}),
        ...(data.result ? { result: toInputJson(data.result) } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(data.approvedAt !== undefined ? { approvedAt: data.approvedAt } : {}),
      },
      include: { workflow: true },
    });
  }

  countActiveRuns(): Promise<number> {
    if (!this.runClient) return Promise.resolve(0);
    return this.runClient.count({
      where: { status: { in: ['running', 'awaiting_approval', 'pending'] } },
    });
  }

  countPendingDecisions(): Promise<number> {
    const decisionClient = (this.prisma.client as unknown as { agentDecision?: { count: (args: unknown) => Promise<number> } })
      .agentDecision;
    if (!decisionClient) return Promise.resolve(0);
    return decisionClient.count({ where: { status: 'pending' } });
  }

  listRecentRuns(limit = 5): Promise<WorkflowRunRow[]> {
    if (!this.runClient) return Promise.resolve([]);
    return this.runClient.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: { workflow: true },
    });
  }
}

export type { WorkflowRow, WorkflowRunRow };
