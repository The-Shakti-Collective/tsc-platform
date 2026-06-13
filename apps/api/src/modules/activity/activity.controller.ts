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
import { ActivityService } from './activity.service';
import { ActivityFeedQuerySchema, ActivityRecordSchema } from './schema';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('feed')
  @UseGuards(ClerkAuthGuard)
  getFeed(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.activityService.getPersonalizedFeed(
      ctx,
      parseSchema(ActivityFeedQuerySchema, query),
    );
  }

  @Get('person/:personId')
  getPersonActivity(
    @Param('personId') personId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.activityService.getPersonActivity(
      personId,
      parseSchema(ActivityFeedQuerySchema, query),
    );
  }

  @Get('community/:communityId')
  getCommunityActivity(
    @Param('communityId') communityId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.activityService.getCommunityActivity(
      communityId,
      parseSchema(ActivityFeedQuerySchema, query),
    );
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  recordActivity(@Body() body: unknown) {
    return this.activityService.recordInternal(
      parseSchema(ActivityRecordSchema, body),
    );
  }
}
