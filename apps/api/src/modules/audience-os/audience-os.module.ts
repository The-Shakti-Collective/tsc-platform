import { Module } from '@nestjs/common';
import { AudienceModule } from '../audience/audience.module';
import { FanModule } from '../fan/fan.module';
import { SupportModule } from '../support/support.module';
import { AudienceOsController } from './audience-os.controller';
import { AudienceOsRepository } from './audience-os.repository';
import { AudienceOsService } from './audience-os.service';

@Module({
  imports: [AudienceModule, FanModule, SupportModule],
  controllers: [AudienceOsController],
  providers: [AudienceOsService, AudienceOsRepository],
  exports: [AudienceOsService],
})
export class AudienceOsModule {}
