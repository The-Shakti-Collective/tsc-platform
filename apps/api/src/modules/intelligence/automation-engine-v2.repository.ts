import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  AUTOMATION_V2_RULE_CATALOG,
  AUTOMATION_V2_TRIGGER_TYPES,
  automationRunInclude,
  type AutomationRuleSeedDefinition,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type { AutomationStepRecord } from './types';

type ArtistHealthRow = {
  artistId: string;
  healthScore: number;
  snapshotDate: Date;
};

type AudienceHealthRow = {
  artistId: string;
  audienceChurn: number;
  snapshotDate: Date;
};

type DealRow = {
  id: string;
  artistId: string;
  status: string;
  updatedAt: Date;
};

type SuperfanRow = {
  artistId: string | null;
  tier: string;
  snapshotDate: Date;
};

@Injectable()
export class AutomationEngineV2Repository {
  constructor(private readonly prisma: PrismaService) {}

  private get ruleClient() {
    return (this.prisma.client as unknown as {
      automationRule?: {
        findMany: (args: unknown) => Promise<unknown[]>;
        findFirst: (args: unknown) => Promise<unknown | null>;
        create: (args: unknown) => Promise<unknown>;
        update: (args: unknown) => Promise<unknown>;
      };
    }).automationRule ?? null;
  }

  private get runClient() {
    return (this.prisma.client as unknown as {
      automationRun?: {
        create: (args: unknown) => Promise<unknown>;
        update: (args: unknown) => Promise<unknown>;
        findMany: (args: unknown) => Promise<unknown[]>;
      };
    }).automationRun ?? null;
  }

  private get artistHealthClient() {
    return (this.prisma.client as unknown as {
      artistHealthSnapshot?: {
        findFirst: (args: unknown) => Promise<ArtistHealthRow | null>;
        findMany: (args: unknown) => Promise<ArtistHealthRow[]>;
      };
    }).artistHealthSnapshot ?? null;
  }

  private get audienceHealthClient() {
    return (this.prisma.client as unknown as {
      audienceHealthSnapshot?: {
        findFirst: (args: unknown) => Promise<AudienceHealthRow | null>;
        findMany: (args: unknown) => Promise<AudienceHealthRow[]>;
      };
    }).audienceHealthSnapshot ?? null;
  }

  private get dealClient() {
    return (this.prisma.client as unknown as {
      deal?: {
        findMany: (args: unknown) => Promise<DealRow[]>;
      };
    }).deal ?? null;
  }

  private get superfanClient() {
    return (this.prisma.client as unknown as {
      superfanSnapshot?: {
        findMany: (args: unknown) => Promise<SuperfanRow[]>;
      };
    }).superfanSnapshot ?? null;
  }

  private get insightClient() {
    return (this.prisma.client as unknown as {
      insight?: {
        create: (args: unknown) => Promise<{ id: string }>;
      };
    }).insight ?? null;
  }

  private get agentClient() {
    return (this.prisma.client as unknown as {
      agent?: {
        findFirst: (args: unknown) => Promise<{ id: string } | null>;
        create: (args: unknown) => Promise<{ id: string }>;
      };
    }).agent ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.ruleClient && this.runClient);
  }

  listActiveV2Rules() {
    if (!this.ruleClient) return Promise.resolve([]);
    return this.ruleClient.findMany({
      where: {
        status: 'active',
        triggerType: { in: [...AUTOMATION_V2_TRIGGER_TYPES] },
      },
      orderBy: { updatedAt: 'desc' },
    }) as Promise<
      Array<{
        id: string;
        name: string;
        workflowType: string;
        triggerType: string;
        trigger: unknown;
        steps: unknown;
        metadata: unknown;
      }>
    >;
  }

  findRuleById(id: string) {
    if (!this.ruleClient) return Promise.resolve(null);
    return this.ruleClient.findFirst({
      where: { id },
    }) as Promise<{
      id: string;
      name: string;
      workflowType: string;
      triggerType: string;
      trigger: unknown;
      steps: unknown;
      metadata: unknown;
    } | null>;
  }

  findRuleByCatalogId(catalogId: string) {
    if (!this.ruleClient) return Promise.resolve(null);
    return this.ruleClient.findFirst({
      where: {
        metadata: {
          path: ['catalogId'],
          equals: catalogId,
        },
      },
    }) as Promise<{ id: string } | null>;
  }

  upsertSeedRule(definition: AutomationRuleSeedDefinition) {
    if (!this.ruleClient) return Promise.resolve(null);
    const catalogId = definition.metadata?.catalogId;
    if (typeof catalogId !== 'string') {
      return this.createSeedRule(definition);
    }

    return this.findRuleByCatalogId(catalogId).then((existing) => {
      if (existing && 'id' in existing) {
        return this.ruleClient!.update({
          where: { id: existing.id },
          data: {
            name: definition.name,
            workflowType: definition.workflowType,
            triggerType: definition.triggerType,
            trigger: toInputJson(definition.trigger),
            steps: toInputJson(definition.steps),
            metadata: toInputJson(definition.metadata ?? {}),
            status: 'active',
          },
        });
      }
      return this.createSeedRule(definition);
    });
  }

  private createSeedRule(definition: AutomationRuleSeedDefinition) {
    return this.ruleClient!.create({
      data: {
        id: newId(),
        name: definition.name,
        workflowType: definition.workflowType,
        triggerType: definition.triggerType,
        trigger: toInputJson(definition.trigger),
        steps: toInputJson(definition.steps),
        status: 'active',
        metadata: toInputJson(definition.metadata ?? {}),
      },
    });
  }

  async ensureSeedRules(): Promise<number> {
    if (!this.ruleClient) return 0;
    let created = 0;
    for (const definition of AUTOMATION_V2_RULE_CATALOG) {
      const catalogId = definition.metadata?.catalogId;
      const existing =
        typeof catalogId === 'string' ? await this.findRuleByCatalogId(catalogId) : null;
      await this.upsertSeedRule(definition);
      if (!existing) created += 1;
    }
    return created;
  }

  createRun(input: {
    ruleId: string;
    trigger: Record<string, unknown>;
    personId?: string | null;
    communityId?: string | null;
    opportunityId?: string | null;
  }) {
    if (!this.runClient) return Promise.resolve(null);
    return this.runClient.create({
      data: {
        id: newId(),
        ruleId: input.ruleId,
        status: 'running',
        trigger: toInputJson(input.trigger),
        steps: toInputJson([]),
        result: toInputJson({}),
        personId: input.personId ?? null,
        communityId: input.communityId ?? null,
        opportunityId: input.opportunityId ?? null,
        startedAt: new Date(),
      },
    }) as Promise<{ id: string }>;
  }

  completeRun(
    id: string,
    data: {
      status: 'completed' | 'failed';
      steps: AutomationStepRecord[];
      result: Record<string, unknown>;
      errorMessage?: string | null;
      opportunityId?: string | null;
      personId?: string | null;
      communityId?: string | null;
    },
  ) {
    if (!this.runClient) return Promise.resolve(null);
    return this.runClient.update({
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
      include: automationRunInclude,
    });
  }

  listRecentRuns(limit = 20) {
    if (!this.runClient) return Promise.resolve([]);
    return this.runClient.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: automationRunInclude,
    }) as Promise<
      Array<{
        id: string;
        ruleId: string | null;
        status: string;
        trigger: unknown;
        steps: unknown;
        result: unknown;
        opportunityId: string | null;
        personId: string | null;
        communityId: string | null;
        errorMessage: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        createdAt: Date;
        rule?: {
          id: string;
          name: string;
          triggerType: string;
          workflowType: string;
        } | null;
      }>
    >;
  }

  findLatestArtistHealth(artistId: string) {
    if (!this.artistHealthClient) return Promise.resolve(null);
    return this.artistHealthClient.findFirst({
      where: { artistId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  listLowHealthArtists(threshold: number, artistId?: string) {
    if (!this.artistHealthClient) return Promise.resolve([]);
    return this.artistHealthClient.findMany({
      where: {
        healthScore: { lt: threshold },
        ...(artistId ? { artistId } : {}),
      },
      orderBy: [{ healthScore: 'asc' }, { snapshotDate: 'desc' }],
      take: artistId ? 1 : 100,
    });
  }

  findLatestAudienceHealth(artistId: string) {
    if (!this.audienceHealthClient) return Promise.resolve(null);
    return this.audienceHealthClient.findFirst({
      where: { artistId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  listHighChurnArtists(threshold: number, artistId?: string) {
    if (!this.audienceHealthClient) return Promise.resolve([]);
    return this.audienceHealthClient.findMany({
      where: {
        audienceChurn: { gt: threshold },
        ...(artistId ? { artistId } : {}),
      },
      orderBy: [{ audienceChurn: 'desc' }, { snapshotDate: 'desc' }],
      take: artistId ? 1 : 100,
    });
  }

  listStaleDeals(staleDays: number, status = 'negotiation', artistId?: string) {
    if (!this.dealClient) return Promise.resolve([]);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);

    return this.dealClient.findMany({
      where: {
        status: status as Prisma.EnumDealStatusFilter['equals'],
        updatedAt: { lt: cutoff },
        ...(artistId ? { artistId } : {}),
      },
      orderBy: { updatedAt: 'asc' },
      take: 100,
    });
  }

  async detectSuperfanDrop(
    artistId: string | undefined,
    dropPercent: number,
    tiers: string[],
  ): Promise<Array<{ artistId: string; previous: number; current: number; dropPct: number }>> {
    if (!this.superfanClient) return [];

    const rows = await this.superfanClient.findMany({
      where: {
        ...(artistId ? { artistId } : { artistId: { not: null } }),
        tier: { in: tiers },
      },
      orderBy: [{ artistId: 'asc' }, { snapshotDate: 'desc' }],
      take: 500,
    });

    const byArtistDate = new Map<string, Map<string, number>>();
    for (const row of rows) {
      if (!row.artistId) continue;
      const dateKey = row.snapshotDate.toISOString().slice(0, 10);
      const artistMap = byArtistDate.get(row.artistId) ?? new Map<string, number>();
      artistMap.set(dateKey, (artistMap.get(dateKey) ?? 0) + 1);
      byArtistDate.set(row.artistId, artistMap);
    }

    const matches: Array<{
      artistId: string;
      previous: number;
      current: number;
      dropPct: number;
    }> = [];

    for (const [id, dateMap] of byArtistDate.entries()) {
      const dates = [...dateMap.keys()].sort((a, b) => b.localeCompare(a));
      if (dates.length < 2) continue;
      const current = dateMap.get(dates[0]) ?? 0;
      const previous = dateMap.get(dates[1]) ?? 0;
      if (previous <= 0) continue;
      const dropPct = ((previous - current) / previous) * 100;
      if (dropPct >= dropPercent) {
        matches.push({ artistId: id, previous, current, dropPct: round2(dropPct) });
      }
    }

    return matches;
  }

  createInsight(input: {
    entityType: string;
    entityId: string;
    category: string;
    title: string;
    severity: 'info' | 'warning' | 'critical';
    payload?: Record<string, unknown>;
  }) {
    if (!this.insightClient) return Promise.resolve(null);
    return this.insightClient.create({
      data: {
        id: newId(),
        entityType: input.entityType,
        entityId: input.entityId,
        category: input.category,
        title: input.title,
        severity: input.severity,
        payload: toInputJson(input.payload ?? {}),
      },
    });
  }

  async ensureAutomationAgent(): Promise<{ id: string } | null> {
    if (!this.agentClient) return null;
    const existing = await this.agentClient.findFirst({
      where: { slug: 'automation-agent' },
    });
    if (existing) return existing;

    return this.agentClient.create({
      data: {
        id: newId(),
        slug: 'automation-agent',
        name: 'Automation Engine',
        type: 'workflow',
        config: toInputJson({ version: 'v2' }),
        isActive: true,
      },
    });
  }

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, personId: true },
    });
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
