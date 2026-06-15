import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsRepository } from './integrations.repository';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsRepository, IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
