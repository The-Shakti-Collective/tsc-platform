import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { DealModule } from '../deal/deal.module';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { SyncEmitterModule } from '../sync/sync-emitter.module';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import { AgencyController } from './agency.controller';
import { AgencyRepository } from './agency.repository';
import { AgencyService } from './agency.service';
import { BrandController } from './brand.controller';
import { BrandRepository } from './brand.repository';
import { BrandService } from './brand.service';
import { BrandSyncEmitter } from './brand-sync.emitter';
import { LabelController } from './label.controller';
import { LabelRepository } from './label.repository';
import { LabelService } from './label.service';

@Module({
  imports: [ActivityModule, SyncEmitterModule, OpportunityModule, DealModule, TscIdentityModule],
  controllers: [BrandController, AgencyController, LabelController],
  providers: [
    BrandService,
    BrandRepository,
    BrandSyncEmitter,
    AgencyService,
    AgencyRepository,
    LabelService,
    LabelRepository,
  ],
  exports: [BrandService, AgencyService, LabelService],
})
export class IndustryModule {}
