import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EmailWriterService } from './services/email-writer.service';
import { PitchWriterService } from './services/pitch-writer.service';
import { ProposalGeneratorService } from './services/proposal-generator.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    ProposalGeneratorService,
    PitchWriterService,
    EmailWriterService,
  ],
  exports: [AiService],
})
export class AiModule {}
