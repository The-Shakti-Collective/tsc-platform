import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { FanModule } from '../fan/fan.module';
import {
  ArtistSupportersController,
  CommunitySupportersController,
  EventSupportersController,
  SupportController,
  SupportFanController,
} from './support.controller';
import { SupportRepository } from './support.repository';
import { SupportService } from './support.service';

@Module({
  imports: [ActivityModule, CreditsModule, FanModule],
  controllers: [
    SupportController,
    SupportFanController,
    ArtistSupportersController,
    CommunitySupportersController,
    EventSupportersController,
  ],
  providers: [SupportService, SupportRepository],
  exports: [SupportService],
})
export class SupportModule {}
