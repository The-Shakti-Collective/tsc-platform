import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { DistrokidAdapter } from './adapters/distrokid.adapter';
import { DistributionController } from './distribution.controller';
import { DistributionRepository } from './distribution.repository';
import { DistributionService } from './distribution.service';

@Module({
  imports: [PrismaModule],
  controllers: [DistributionController],
  providers: [DistributionRepository, DistributionService, DistrokidAdapter],
  exports: [DistributionService],
})
export class DistributionModule {}
