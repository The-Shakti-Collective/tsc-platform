import { Module, forwardRef } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { CreativeIdentityModule } from '../creative-identity/creative-identity.module';
import { IdentityModule } from '../identity/identity.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { ProfileModule } from '../profile/profile.module';
import { TscIdentityModule } from '../tsc-identity/tsc-identity.module';
import { SyncController } from './sync.controller';
import { SyncEmitterModule } from './sync-emitter.module';
import { SyncRepository } from './sync.repository';
import { SyncService } from './sync.service';

@Module({
  imports: [
    SyncEmitterModule,
    IntelligenceModule,
    IdentityModule,
    forwardRef(() => ProfileModule),
    TscIdentityModule,
    CreativeIdentityModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncRepository],
  exports: [SyncService, SyncRepository, SyncEmitterModule],
})
export class SyncModule {}
