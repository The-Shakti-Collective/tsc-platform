import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { ProfileModule } from '../profile/profile.module';
import { FanModule } from '../fan/fan.module';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import { CommunityController } from './community.controller';
import { CommunityRepository } from './community.repository';
import { CommunityService } from './community.service';

@Module({
  imports: [ProfileModule, FanModule, ActivityModule, CreditsModule, TscIdentityModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityRepository],
  exports: [CommunityService, CommunityRepository],
})
export class CommunityModule {}
