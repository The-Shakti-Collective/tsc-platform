import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
  AutomationRuleCreateSchema,
  AutomationRuleListQuerySchema,
  AutomationRuleUpdateSchema,
  AutomationTriggerSchema,
} from './schema';

@Controller('intelligence/automation')
@UseGuards(ClerkAuthGuard)
export class AutomationController {
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

  @Get('rules/:id')
  getRule(@Param('id') id: string) {
    return this.automationService.getRule(id);
  }

  @Post('rules')
  createRule(@Body() body: unknown) {
    return this.automationService.createRule(
      parseSchema(AutomationRuleCreateSchema, body),
    );
  }

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() body: unknown) {
    return this.automationService.updateRule(
      id,
      parseSchema(AutomationRuleUpdateSchema, body),
    );
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.automationService.deleteRule(id);
  }

  @Post('evaluate')
  evaluateAll(@Req() req: { user?: { personId?: string; userId?: string } }) {
    const actorPersonId = req.user?.personId ?? req.user?.userId ?? null;
    return this.automationEngineV2.evaluateAll(actorPersonId);
  }

  @Post('evaluate/artist/:id')
  evaluateArtist(
    @Param('id') artistId: string,
    @Req() req: { user?: { personId?: string; userId?: string } },
  ) {
    const actorPersonId = req.user?.personId ?? req.user?.userId ?? null;
    return this.automationEngineV2.evaluateArtist(artistId, actorPersonId);
  }

  @Post('trigger')
  trigger(@Body() body: unknown) {
    return this.automationService.trigger(parseSchema(AutomationTriggerSchema, body));
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
