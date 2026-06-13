import { Module, forwardRef } from '@nestjs/common';
import { DealModule } from '../deal/deal.module';
import { DataExchangeModule } from '../data-exchange/data-exchange.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { BookingController } from './booking.controller';
import { BookingRepository } from './booking.repository';
import { BookingService } from './booking.service';

@Module({
  imports: [IntelligenceModule, forwardRef(() => DataExchangeModule), forwardRef(() => DealModule)],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService, BookingRepository],
})
export class BookingModule {}
