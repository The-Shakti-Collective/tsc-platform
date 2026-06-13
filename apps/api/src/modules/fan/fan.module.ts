import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import { ArtistFansController, FanController } from './fan.controller';
import { FanRepository } from './fan.repository';
import { FanService } from './fan.service';
import { SuperfanService } from './superfan.service';

@Module({
  imports: [ActivityModule, CreditsModule, TscIdentityModule],
  controllers: [FanController, ArtistFansController],
  providers: [FanService, SuperfanService, FanRepository],
  exports: [FanService, SuperfanService],
})
export class FanModule {}
