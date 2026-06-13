import { Module, forwardRef } from '@nestjs/common';
import { OpportunityModule } from '../opportunity/opportunity.module';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import { DataExchangeModule } from '../data-exchange/data-exchange.module';
import {
  ArtistPassportController,
  PassportController,
  PublicPassportController,
} from './passport.controller';
import { PassportRepository } from './passport.repository';
import { PassportService } from './passport.service';
import { PassportSyncEmitter } from './passport-sync.emitter';

@Module({
  imports: [forwardRef(() => OpportunityModule), TscIdentityModule, forwardRef(() => DataExchangeModule)],
  controllers: [
    PublicPassportController,
    PassportController,
    ArtistPassportController,
  ],
  providers: [PassportService, PassportRepository, PassportSyncEmitter],
  exports: [PassportService, PassportSyncEmitter],
})
export class PassportModule {}
