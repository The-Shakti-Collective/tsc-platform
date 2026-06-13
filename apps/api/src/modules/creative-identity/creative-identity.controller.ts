import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { AddCreativeIdentitySkillSchema, SkillIdParamSchema } from '../skills/schema';
import { SkillsService } from '../skills/skills.service';
import {
  CreativeIdentityPatchSchema,
  CreativeIdentitySlugParamSchema,
  CreativeRoleAssignmentSchema,
  CreativeRoleIdParamSchema,
} from './schema';
import { CreativeIdentityService } from './creative-identity.service';

@Controller('creative-identity')
export class PublicCreativeIdentityController {
  constructor(
    private readonly service: CreativeIdentityService,
    private readonly skillsService: SkillsService,
  ) {}

  @Get(':slug/public')
  getPublic(@Param() params: Record<string, string>) {
    const parsed = parseSchema(CreativeIdentitySlugParamSchema, params);
    return this.service.getPublicBySlug(parsed.slug);
  }

  @Get(':slug/roles')
  getRoles(@Param() params: Record<string, string>) {
    const parsed = parseSchema(CreativeIdentitySlugParamSchema, params);
    return this.service.getRolesBySlug(parsed.slug);
  }

  @Get(':slug/skills')
  getSkills(@Param() params: Record<string, string>) {
    const parsed = parseSchema(CreativeIdentitySlugParamSchema, params);
    return this.skillsService.getSkillsByCreativeSlug(parsed.slug);
  }
}

@Controller('creative-identity')
@UseGuards(ClerkAuthGuard)
export class CreativeIdentityController {
  constructor(
    private readonly service: CreativeIdentityService,
    private readonly skillsService: SkillsService,
  ) {}

  @Get('me')
  getMe(@Membership() ctx: MembershipContext) {
    return this.service.getMyIdentity(ctx);
  }

  @Patch('me')
  patchMe(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.service.patchMyIdentity(parseSchema(CreativeIdentityPatchSchema, body), ctx);
  }

  @Post('me/skills')
  addSkill(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.skillsService.addSkillToMyProfile(
      parseSchema(AddCreativeIdentitySkillSchema, body),
      ctx,
    );
  }

  @Delete('me/skills/:skillId')
  removeSkill(@Param() params: Record<string, string>, @Membership() ctx: MembershipContext) {
    const parsed = parseSchema(SkillIdParamSchema, params);
    return this.skillsService.removeSkillFromMyProfile(parsed.skillId, ctx);
  }

  @Post('me/roles')
  addRole(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.service.addRoleAssignment(
      parseSchema(CreativeRoleAssignmentSchema, body),
      ctx,
    );
  }

  @Delete('me/roles/:roleId')
  removeRole(
    @Param() params: Record<string, string>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(CreativeRoleIdParamSchema, params);
    return this.service.removeRoleAssignment(parsed.roleId, ctx);
  }
}
