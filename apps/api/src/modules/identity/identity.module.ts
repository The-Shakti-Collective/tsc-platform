import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { FanModule } from '../fan/fan.module';
import { CreativeIdentityModule } from '../creative-identity/creative-identity.module';
import { IdentityController } from './identity.controller';
import { PlatformIdentityController } from './platform-identity.controller';
import { IdentityRepository } from './identity.repository';
import { IdentityResolutionService } from './identity-resolution.service';
import { IdentityService } from './identity.service';
import { IdentitySyncEmitter } from './identity-sync.emitter';

@Module({
  imports: [ProfileModule, FanModule, CreativeIdentityModule],
  controllers: [IdentityController, PlatformIdentityController],
  providers: [
    IdentityService,
    IdentityResolutionService,
    IdentityRepository,
    IdentitySyncEmitter,
  ],
  exports: [IdentityService, IdentityResolutionService, IdentityRepository],
})
export class IdentityModule {}
