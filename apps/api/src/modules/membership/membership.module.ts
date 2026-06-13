import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { DataExchangeModule } from '../data-exchange/data-exchange.module';
import { FanModule } from '../fan/fan.module';
import { SupportModule } from '../support/support.module';
import {
  MembershipCommunityController,
  MembershipController,
  MembershipFanController,
} from './membership.controller';
import { MembershipRepository } from './membership.repository';
import { MembershipService } from './membership.service';

@Module({
  imports: [ActivityModule, CreditsModule, FanModule, SupportModule, forwardRef(() => DataExchangeModule)],
  controllers: [
    MembershipCommunityController,
    MembershipController,
    MembershipFanController,
  ],
  providers: [MembershipService, MembershipRepository],
  exports: [MembershipService],
})
export class MembershipModule {}
