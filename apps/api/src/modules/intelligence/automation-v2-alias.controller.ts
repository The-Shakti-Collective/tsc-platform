import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { AutomationEngineV2Service } from './automation-engine-v2.service';
import { AutomationService } from './automation.service';
import {
  AutomationRecentRunsQuerySchema,
  AutomationRuleListQuerySchema,
} from './schema';

/** CoreKnot client compat — `/api/agents/automation-v2` maps to `/api/intelligence/automation`. */
@Controller('agents/automation-v2')
@UseGuards(ClerkAuthGuard)
export class AutomationV2AliasController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly automationEngineV2: AutomationEngineV2Service,
  ) {}

  @Get('rules')
  listRules(@Query() query: Record<string, unknown>) {
    return this.automationService.listRules(
      parseSchema(AutomationRuleListQuerySchema, query),
    );
  }

  @Get('runs/recent')
  listRecentRuns(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(AutomationRecentRunsQuerySchema, query);
    return this.automationEngineV2.listRecentRuns(parsed.limit);
  }

  @Post('evaluate')
  evaluateAll(@Req() req: { user?: { personId?: string; userId?: string } }) {
    const actorPersonId = req.user?.personId ?? req.user?.userId ?? null;
    return this.automationEngineV2.evaluateAll(actorPersonId);
  }

  @Post('rules/:id/run')
  runRule(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: { user?: { personId?: string; userId?: string } },
  ) {
    const actorPersonId = req.user?.personId ?? req.user?.userId ?? null;
    const payload =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    return this.automationEngineV2.evaluateRule(id, actorPersonId, payload);
  }
}
