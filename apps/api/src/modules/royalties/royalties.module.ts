import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { RoyaltiesController } from './royalties.controller';
import { RoyaltiesRepository } from './royalties.repository';
import { RoyaltiesService } from './royalties.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoyaltiesController],
  providers: [RoyaltiesRepository, RoyaltiesService],
  exports: [RoyaltiesService],
})
export class RoyaltiesModule {}
