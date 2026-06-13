import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { DiscoveryQuerySchema } from '@tsc/contracts/discovery';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
@UseGuards(ClerkAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('people')
  discoverPeople(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.discoveryService.discoverPeople(
      ctx,
      parseSchema(DiscoveryQuerySchema, query),
    );
  }

  @Get('communities')
  discoverCommunities(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.discoveryService.discoverCommunities(
      ctx,
      parseSchema(DiscoveryQuerySchema, query),
    );
  }

  @Get('events')
  discoverEvents(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.discoveryService.discoverEvents(
      ctx,
      parseSchema(DiscoveryQuerySchema, query),
    );
  }

  @Get('collaborations')
  discoverCollaborations(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.discoveryService.discoverCollaborations(
      ctx,
      parseSchema(DiscoveryQuerySchema, query),
    );
  }
}
