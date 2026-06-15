import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { GigListQuerySchema } from '../gigs/dto';
import { GigsService } from '../gigs/gigs.service';

/** Calendar view — reuses Gig records as scheduled events. */
@Controller('calendar')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly gigsService: GigsService) {}

  @Get('events')
  events(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(GigListQuerySchema, query);
    return this.gigsService.list(parsed.organizationId, ctx, {
      artistId: parsed.artistId,
      from: parsed.from,
      to: parsed.to,
      limit: parsed.limit,
    });
  }
}
