import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ContractModule } from '../contract/contract.module';
import { DataExchangeModule } from '../data-exchange/data-exchange.module';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { SyncEmitterModule } from '../sync/sync-emitter.module';
import {
  ArtistDealsController,
  BrandDealsController,
  DealController,
} from './deal.controller';
import { DealRepository } from './deal.repository';
import { DealService } from './deal.service';
import { DealSyncEmitter } from './deal-sync.emitter';

@Module({
  imports: [
    ActivityModule,
    SyncEmitterModule,
    forwardRef(() => DataExchangeModule),
    ContractModule,
    forwardRef(() => OpportunityModule),
  ],
  controllers: [DealController, ArtistDealsController, BrandDealsController],
  providers: [DealService, DealRepository, DealSyncEmitter],
  exports: [DealService, DealRepository],
})
export class DealModule {}
