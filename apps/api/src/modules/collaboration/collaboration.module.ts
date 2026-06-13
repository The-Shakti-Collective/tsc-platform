import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CreditsModule } from '../credits/credits.module';
import { CollaborationController } from './collaboration.controller';
import { CollaborationRepository } from './collaboration.repository';
import { CollaborationService } from './collaboration.service';

@Module({
  imports: [ActivityModule, CreditsModule],
  controllers: [CollaborationController],
  providers: [CollaborationService, CollaborationRepository],
  exports: [CollaborationService],
})
export class CollaborationModule {}
