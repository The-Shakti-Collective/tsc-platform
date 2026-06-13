import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Goal } from '@tsc/database';
import { GoalRepository } from './automation.repository';
import type {
  GoalCreateInput,
  GoalDashboardQuery,
  GoalListQuery,
  GoalUpdateInput,
} from './dto';
import type {
  GoalDashboardEntry,
  GoalDashboardEntity,
  GoalDashboardPayload,
  GoalDto,
} from './types';

@Injectable()
export class GoalService {
  constructor(private readonly goalRepository: GoalRepository) {}

  async listGoals(query: GoalListQuery): Promise<GoalDto[]> {
    const rows = await this.goalRepository.listGoals(query);
    return rows.map((row) => this.toGoalDto(row));
  }

  async getGoal(id: string): Promise<GoalDto> {
    const row = await this.goalRepository.findGoal(id);
    if (!row) {
      throw new NotFoundException(`Goal ${id} not found`);
    }
    return this.toGoalDto(row);
  }

  async createGoal(input: GoalCreateInput): Promise<GoalDto> {
    const row = await this.goalRepository.createGoal(input);
    return this.toGoalDto(row);
  }

  async updateGoal(id: string, input: GoalUpdateInput): Promise<GoalDto> {
    await this.getGoal(id);
    const row = await this.goalRepository.updateGoal(id, input);
    return this.toGoalDto(row);
  }

  async recordProgress(
    id: string,
    input: { current: number; metadata?: Record<string, unknown> },
  ): Promise<GoalDto> {
    await this.getGoal(id);
    await this.goalRepository.recordProgress(id, input.current, input.metadata);
    const row = await this.goalRepository.findGoal(id);
    if (!row) throw new NotFoundException(`Goal ${id} not found`);
    return this.toGoalDto(row);
  }

  async deleteGoal(id: string): Promise<{ success: true }> {
    await this.getGoal(id);
    await this.goalRepository.deleteGoal(id);
    return { success: true };
  }

  async getDashboard(query: GoalDashboardQuery): Promise<GoalDashboardPayload> {
    const rows = await this.goalRepository.listGoalsForDashboard(
      query.entityType,
      query.entityId,
    );

    const byEntity = new Map<string, GoalDashboardEntity>();

    for (const row of rows) {
      const key = `${row.entityType}:${row.entityId}`;
      const entry = this.toDashboardEntry(row);
      const existing = byEntity.get(key);
      if (existing) {
        existing.goals.push(entry);
        continue;
      }
      byEntity.set(key, {
        entityType: row.entityType,
        entityId: row.entityId,
        goals: [entry],
      });
    }

    const entities = [...byEntity.values()];
    let onTrack = 0;
    let atRisk = 0;
    let completed = 0;

    for (const entity of entities) {
      for (const goal of entity.goals) {
        if (goal.current >= goal.target) completed += 1;
        else if (goal.onTrack) onTrack += 1;
        else atRisk += 1;
      }
    }

    return {
      entities,
      summary: {
        totalGoals: rows.length,
        onTrack,
        atRisk,
        completed,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  private toGoalDto(row: Goal): GoalDto {
    const gap = Math.max(0, row.target - row.current);
    const progressPercent =
      row.target > 0 ? round2(Math.min(100, (row.current / row.target) * 100)) : 0;

    return {
      id: row.id,
      name: row.name,
      entityType: row.entityType,
      entityId: row.entityId,
      metric: row.metric,
      target: row.target,
      current: row.current,
      period: row.period,
      periodStart: row.periodStart?.toISOString() ?? null,
      periodEnd: row.periodEnd?.toISOString() ?? null,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      gap,
      progressPercent,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDashboardEntry(row: Goal): GoalDashboardEntry {
    const gap = Math.max(0, row.target - row.current);
    const progressPercent =
      row.target > 0 ? round2(Math.min(100, (row.current / row.target) * 100)) : 0;
    const projection = computeProjection(
      row.current,
      row.periodStart,
      row.periodEnd,
    );
    const onTrack =
      row.current >= row.target ||
      (row.target > 0 && projection >= row.target * 0.9);

    return {
      goalId: row.id,
      name: row.name,
      metric: row.metric,
      current: row.current,
      target: row.target,
      gap,
      projection,
      progressPercent,
      period: row.period,
      periodStart: row.periodStart?.toISOString() ?? null,
      periodEnd: row.periodEnd?.toISOString() ?? null,
      onTrack,
    };
  }
}

function computeProjection(
  current: number,
  periodStart: Date | null,
  periodEnd: Date | null,
): number {
  if (!periodStart || !periodEnd || periodEnd <= periodStart) {
    return current;
  }

  const now = Date.now();
  const start = periodStart.getTime();
  const end = periodEnd.getTime();
  const elapsedMs = Math.max(1, Math.min(now, end) - start);
  const totalMs = Math.max(1, end - start);
  const rate = current / (elapsedMs / (1000 * 60 * 60 * 24));
  const totalDays = totalMs / (1000 * 60 * 60 * 24);
  return round2(rate * totalDays);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
