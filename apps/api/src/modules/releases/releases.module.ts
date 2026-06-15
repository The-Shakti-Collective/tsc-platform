import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { ReleasesController } from './releases.controller';
import { ReleasesRepository } from './releases.repository';
import { ReleasesService } from './releases.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReleasesController],
  providers: [ReleasesRepository, ReleasesService],
  exports: [ReleasesService],
})
export class ReleasesModule {}
