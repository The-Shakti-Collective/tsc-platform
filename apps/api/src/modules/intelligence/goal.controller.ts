import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  GoalCreateSchema,
  GoalDashboardQuerySchema,
  GoalListQuerySchema,
  GoalUpdateSchema,
  IntelligenceGoalProgressSchema,
} from './schema';
import { GoalService } from './goal.service';

@Controller('intelligence/goals')
@UseGuards(ClerkAuthGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Get('dashboard')
  getDashboard(@Query() query: Record<string, unknown>) {
    return this.goalService.getDashboard(
      parseSchema(GoalDashboardQuerySchema, query),
    );
  }

  @Get()
  listGoals(@Query() query: Record<string, unknown>) {
    return this.goalService.listGoals(parseSchema(GoalListQuerySchema, query));
  }

  @Get(':id')
  getGoal(@Param('id') id: string) {
    return this.goalService.getGoal(id);
  }

  @Post()
  createGoal(@Body() body: unknown) {
    return this.goalService.createGoal(parseSchema(GoalCreateSchema, body));
  }

  @Patch(':id/progress')
  updateProgress(@Param('id') id: string, @Body() body: unknown) {
    return this.goalService.recordProgress(id, {
      current: parseSchema(IntelligenceGoalProgressSchema, body).current,
      metadata: parseSchema(IntelligenceGoalProgressSchema, body).metadata,
    });
  }

  @Patch(':id')
  updateGoal(@Param('id') id: string, @Body() body: unknown) {
    return this.goalService.updateGoal(id, parseSchema(GoalUpdateSchema, body));
  }

  @Delete(':id')
  deleteGoal(@Param('id') id: string) {
    return this.goalService.deleteGoal(id);
  }
}
