import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  CollaborationApplicationUpdateSchema,
  CollaborationApplySchema,
  CollaborationBrowseQuerySchema,
  CollaborationCreateSchema,
  CollaborationUpdateSchema,
} from './schema';
import { CollaborationService } from './collaboration.service';

@Controller('collaborations')
@UseGuards(ClerkAuthGuard)
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get()
  browse(@Query() query: Record<string, unknown>) {
    return this.collaborationService.browse(
      parseSchema(CollaborationBrowseQuerySchema, query),
    );
  }

  @Get('me/created')
  listMyCreated(@Membership() ctx: MembershipContext) {
    return this.collaborationService.listMyCreated(ctx);
  }

  @Get('me/applications')
  listMyApplications(@Membership() ctx: MembershipContext) {
    return this.collaborationService.listMyApplications(ctx);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.collaborationService.getDetail(id, ctx);
  }

  @Post()
  create(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.collaborationService.create(
      parseSchema(CollaborationCreateSchema, body),
      ctx,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.collaborationService.update(
      id,
      parseSchema(CollaborationUpdateSchema, body),
      ctx,
    );
  }

  @Post(':id/apply')
  apply(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.collaborationService.apply(
      id,
      parseSchema(CollaborationApplySchema, body),
      ctx,
    );
  }

  @Patch(':id/applications/:applicationId')
  updateApplication(
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.collaborationService.updateApplication(
      id,
      applicationId,
      parseSchema(CollaborationApplicationUpdateSchema, body),
      ctx,
    );
  }
}
