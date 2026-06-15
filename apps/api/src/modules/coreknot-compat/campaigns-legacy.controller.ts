import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { CoreknotCompatGuard } from '../../common/guards/coreknot-compat.guard';

/** CoreKnot client compat — flat `/api/campaigns` (Express campaignApiRouter). P1 stub until messaging/campaigns module. */
@Controller('campaigns')
@UseGuards(CoreknotCompatGuard, ClerkAuthGuard)
export class CampaignsLegacyController {
  @Get()
  list() {
    return [];
  }
}
