import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { FanModule } from '../fan/fan.module';
import {
  RewardsAdminController,
  RewardsController,
  RewardsFanController,
} from './rewards.controller';
import { RewardsRepository } from './rewards.repository';
import { RewardsService } from './rewards.service';

@Module({
  imports: [ActivityModule, CreditsModule, FanModule],
  controllers: [RewardsController, RewardsFanController, RewardsAdminController],
  providers: [RewardsService, RewardsRepository],
  exports: [RewardsService],
})
export class RewardsModule {}
