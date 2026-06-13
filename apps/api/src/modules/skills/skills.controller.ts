import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  EndorseSkillSchema,
  SkillCreatorsQuerySchema,
  SkillSlugParamSchema,
  SkillsListQuerySchema,
} from './schema';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const parsed = parseSchema(SkillsListQuerySchema, query);
    return this.service.listSkills(parsed.category ?? null);
  }

  @Get(':slug')
  getBySlug(@Param() params: Record<string, string>) {
    const parsed = parseSchema(SkillSlugParamSchema, params);
    return this.service.getSkillBySlug(parsed.slug);
  }

  @Get(':slug/creators')
  getCreators(@Param() params: Record<string, string>, @Query() query: Record<string, string>) {
    const parsedParams = parseSchema(SkillSlugParamSchema, params);
    const parsedQuery = parseSchema(SkillCreatorsQuerySchema, query);
    return this.service.getCreatorsBySkillSlug(
      parsedParams.slug,
      parsedQuery.city ?? null,
      parsedQuery.limit,
    );
  }

  @Post(':slug/endorse')
  @UseGuards(ClerkAuthGuard)
  endorse(
    @Param() params: Record<string, string>,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const parsedParams = parseSchema(SkillSlugParamSchema, params);
    const parsedBody = parseSchema(EndorseSkillSchema, body);
    return this.service.endorseCreator(parsedParams.slug, parsedBody, ctx);
  }
}
