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
import { FollowListQuerySchema } from '@tsc/contracts';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { ActivityFeedQuerySchema } from '../activity/schema';
import {
  AdminVerificationPatchSchema,
  CommunityVerificationRequestSchema,
  ProfileEditSchema,
  UsernameCheckSchema,
} from './schema';
import { ProfileService } from './profile.service';
import { ActivityService } from '../activity/activity.service';

/** Public TSC profile at tsc.in/:slug */
@Controller('profile')
export class PublicProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':slug/public')
  getPublicProfile(@Param('slug') slug: string) {
    return this.profileService.getPublicProfileBySlug(slug);
  }

  @Get(':slug/ecosystem')
  getEcosystemPassport(@Param('slug') slug: string) {
    return this.profileService.getEcosystemPassportBySlug(slug);
  }
}

@Controller('profile')
@UseGuards(ClerkAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly activityService: ActivityService,
  ) {}

  @Get('me')
  getMyProfile(@Membership() ctx: MembershipContext) {
    return this.profileService.getMyProfile(ctx);
  }

  @Patch('me')
  updateMyProfile(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.profileService.updateMyProfile(
      parseSchema(ProfileEditSchema, body),
      ctx,
    );
  }

  @Post('username/check')
  checkUsername(@Body() body: unknown) {
    return this.profileService.checkUsername(parseSchema(UsernameCheckSchema, body));
  }

  @Get('me/following/feed')
  getFollowingFeed(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.activityService.getFollowingFeed(
      ctx,
      parseSchema(ActivityFeedQuerySchema, query),
    );
  }

  @Post('follow/:personId')
  followPerson(
    @Param('personId') personId: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.profileService.followPerson(personId, ctx);
  }

  @Delete('unfollow/:personId')
  unfollowPerson(
    @Param('personId') personId: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.profileService.unfollowPerson(personId, ctx);
  }

  @Get(':personId/followers')
  listFollowers(
    @Param('personId') personId: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(FollowListQuerySchema, query);
    return this.profileService.listFollowers(personId, parsed.page, parsed.limit);
  }

  @Get(':personId/following')
  listFollowing(
    @Param('personId') personId: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(FollowListQuerySchema, query);
    return this.profileService.listFollowing(personId, parsed.page, parsed.limit);
  }

  @Get(':personId/follow-status')
  getFollowStatus(
    @Param('personId') personId: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.profileService.getFollowStatus(personId, ctx);
  }

  @Get(':id/verification')
  getVerification(@Param('id') id: string) {
    return this.profileService.getVerification(id);
  }

  @Post('verification/request-community')
  requestCommunityVerification(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.profileService.requestCommunityVerification(
      parseSchema(CommunityVerificationRequestSchema, body),
      ctx,
    );
  }
}

@Controller('admin/verification')
@UseGuards(ClerkAuthGuard)
export class AdminVerificationController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch(':personId')
  setAdminVerification(
    @Param('personId') personId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.profileService.setAdminVerification(
      personId,
      parseSchema(AdminVerificationPatchSchema, body),
      ctx,
    );
  }
}
