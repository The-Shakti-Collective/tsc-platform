import { Module } from '@nestjs/common';
import { GigsModule } from '../gigs/gigs.module';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [GigsModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
