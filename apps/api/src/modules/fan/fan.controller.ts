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
import { FanService } from './fan.service';
import { SuperfanService } from './superfan.service';
import {
  ArtistFansQuerySchema,
  ArtistSuperfansQuerySchema,
  FanGraphQuerySchema,
  FanProfilePatchSchema,
  SuperfanQuerySchema,
} from './schema';

@Controller('fans')
export class FanController {
  constructor(
    private readonly fanService: FanService,
    private readonly superfanService: SuperfanService,
  ) {}

  @Get('me/profile')
  @UseGuards(ClerkAuthGuard)
  getMyProfile(@Membership() ctx: MembershipContext) {
    return this.fanService.getMyProfile(ctx);
  }

  @Patch('me/profile')
  @UseGuards(ClerkAuthGuard)
  patchMyProfile(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.fanService.patchMyProfile(
      parseSchema(FanProfilePatchSchema, body),
      ctx,
    );
  }

  @Post('follow/:artistId')
  @UseGuards(ClerkAuthGuard)
  followArtist(
    @Param('artistId') artistId: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.fanService.followArtist(artistId, ctx);
  }

  @Post('support/:artistId')
  @UseGuards(ClerkAuthGuard)
  supportArtist(
    @Param('artistId') artistId: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.fanService.supportArtist(artistId, ctx);
  }

  @Post('superfan/refresh/:personId')
  @UseGuards(ClerkAuthGuard)
  refreshSuperfan(
    @Param('personId') personId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(SuperfanQuerySchema, query);
    return this.superfanService.refreshSuperfan(personId, parsed.artistId, ctx);
  }

  @Get(':personId/profile')
  getPublicProfile(@Param('personId') personId: string) {
    return this.fanService.getPublicProfile(personId);
  }

  @Get(':personId/scores')
  getScores(@Param('personId') personId: string) {
    return this.fanService.getScores(personId);
  }

  @Get(':personId/graph')
  @UseGuards(ClerkAuthGuard)
  getFanGraph(
    @Param('personId') personId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(FanGraphQuerySchema, query);
    return this.fanService.getFanGraph(personId, ctx, parsed.includeInactive);
  }

  @Get(':personId/superfan')
  getSuperfan(
    @Param('personId') personId: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(SuperfanQuerySchema, query);
    return this.superfanService.getSuperfan(personId, parsed.artistId);
  }
}

@Controller('artists')
export class ArtistFansController {
  constructor(
    private readonly fanService: FanService,
    private readonly superfanService: SuperfanService,
  ) {}

  @Get(':id/fans')
  listTopFans(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(ArtistFansQuerySchema, query);
    return this.fanService.getArtistTopFans(id, parsed.limit);
  }

  @Get(':id/superfans')
  listSuperfans(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(ArtistSuperfansQuerySchema, query);
    return this.superfanService.getArtistSuperfans(id, parsed.limit);
  }

  @Get(':id/superfan-segments')
  superfanSegments(@Param('id') id: string) {
    return this.superfanService.getArtistSuperfanSegments(id);
  }
}
