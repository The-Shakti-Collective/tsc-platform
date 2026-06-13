import { Module } from '@nestjs/common';
import { AdminWhiteLabelController } from './admin-white-label.controller';
import { WhiteLabelController } from './white-label.controller';
import { WhiteLabelRepository } from './white-label.repository';
import { WhiteLabelService } from './white-label.service';

@Module({
  controllers: [WhiteLabelController, AdminWhiteLabelController],
  providers: [WhiteLabelService, WhiteLabelRepository],
  exports: [WhiteLabelService, WhiteLabelRepository],
})
export class WhiteLabelModule {}
