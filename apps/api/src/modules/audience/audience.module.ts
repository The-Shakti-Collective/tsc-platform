import { Module } from '@nestjs/common';
import { AudienceAdminController, AudienceController } from './audience.controller';
import { AudienceRepository } from './audience.repository';
import { AudienceService } from './audience.service';

@Module({
  controllers: [AudienceController, AudienceAdminController],
  providers: [AudienceService, AudienceRepository],
  exports: [AudienceService],
})
export class AudienceModule {}
