import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { ReputationService } from './reputation.service';

@Controller('reputation')
@UseGuards(ClerkAuthGuard)
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('person/:id')
  getPersonReputation(@Param('id') id: string) {
    return this.reputationService.getPersonReputation(id);
  }

  @Get('community/:id')
  getCommunityReputation(@Param('id') id: string) {
    return this.reputationService.getCommunityReputation(id);
  }

  @Post('refresh/:entityType/:entityId')
  refresh(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Membership() ctx: MembershipContext,
  ) {
    const parsedType =
      entityType === 'Person' || entityType === 'Artist' || entityType === 'Community'
        ? entityType
        : 'Person';
    return this.reputationService.refresh(parsedType, entityId, ctx);
  }
}
