import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { ProfileModule } from '../profile/profile.module';
import { FanModule } from '../fan/fan.module';
import { SupportModule } from '../support/support.module';
import { EventController } from './event.controller';
import { EventRepository } from './event.repository';
import { EventService } from './event.service';

@Module({
  imports: [forwardRef(() => ProfileModule), FanModule, ActivityModule, CreditsModule, SupportModule],
  controllers: [EventController],
  providers: [EventService, EventRepository],
  exports: [EventService, EventRepository],
})
export class EventModule {}
