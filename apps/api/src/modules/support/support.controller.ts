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
  RecordSupportInputSchema,
  SupportHistoryQuerySchema,
  SupportersQuerySchema,
} from './schema';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('artist/:artistId')
  @UseGuards(ClerkAuthGuard)
  recordArtistSupport(
    @Param('artistId') artistId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.supportService.recordArtistSupport(
      artistId,
      parseSchema(RecordSupportInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('community/:communityId')
  @UseGuards(ClerkAuthGuard)
  recordCommunitySupport(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.supportService.recordCommunitySupport(
      communityId,
      parseSchema(RecordSupportInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('event/:eventId')
  @UseGuards(ClerkAuthGuard)
  recordEventSupport(
    @Param('eventId') eventId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.supportService.recordEventSupport(
      eventId,
      parseSchema(RecordSupportInputSchema, body ?? {}),
      ctx,
    );
  }
}

@Controller('fans')
export class SupportFanController {
  constructor(private readonly supportService: SupportService) {}

  @Get('me/support-history')
  @UseGuards(ClerkAuthGuard)
  getMySupportHistory(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(SupportHistoryQuerySchema, query);
    return this.supportService.getMySupportHistory(ctx, parsed.limit);
  }
}

@Controller('artists')
export class ArtistSupportersController {
  constructor(private readonly supportService: SupportService) {}

  @Get(':id/supporters')
  listSupporters(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(SupportersQuerySchema, query);
    return this.supportService.getArtistSupporters(id, parsed.limit, parsed.sortBy);
  }
}

@Controller('communities')
export class CommunitySupportersController {
  constructor(private readonly supportService: SupportService) {}

  @Get(':id/supporters')
  listSupporters(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(SupportersQuerySchema, query);
    return this.supportService.getCommunitySupporters(id, parsed.limit, parsed.sortBy);
  }
}

@Controller('events')
export class EventSupportersController {
  constructor(private readonly supportService: SupportService) {}

  @Get(':id/supporters')
  listSupporters(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = parseSchema(SupportersQuerySchema, query);
    return this.supportService.getEventSupporters(id, parsed.limit, parsed.sortBy);
  }
}
