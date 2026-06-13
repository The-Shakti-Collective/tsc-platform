import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { DataExchangeModule } from '../data-exchange/data-exchange.module';
import { FanModule } from '../fan/fan.module';
import { SupportModule } from '../support/support.module';
import { CommerceController, CommerceFanController } from './commerce.controller';
import { CommerceRepository } from './commerce.repository';
import { CommerceService } from './commerce.service';

@Module({
  imports: [SupportModule, ActivityModule, CreditsModule, FanModule, forwardRef(() => DataExchangeModule)],
  controllers: [CommerceController, CommerceFanController],
  providers: [CommerceService, CommerceRepository],
  exports: [CommerceService],
})
export class CommerceModule {}
