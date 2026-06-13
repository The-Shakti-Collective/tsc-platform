import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { CreditsController } from './credits.controller';
import { CreditsRepository } from './credits.repository';
import { CreditsService } from './credits.service';

@Module({
  imports: [PrismaModule],
  controllers: [CreditsController],
  providers: [CreditsService, CreditsRepository],
  exports: [CreditsService],
})
export class CreditsModule {}
