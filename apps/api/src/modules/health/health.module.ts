import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { QueuesModule } from '../../queues/queues.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
