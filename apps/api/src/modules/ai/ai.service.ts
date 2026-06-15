import { Injectable } from '@nestjs/common';
import type { AiEmailRequest, AiPitchRequest, AiProposalRequest } from './schema';
import { EmailWriterService } from './services/email-writer.service';
import { PitchWriterService } from './services/pitch-writer.service';
import { ProposalGeneratorService } from './services/proposal-generator.service';

@Injectable()
export class AiService {
  constructor(
    private readonly proposalGenerator: ProposalGeneratorService,
    private readonly pitchWriter: PitchWriterService,
    private readonly emailWriter: EmailWriterService,
  ) {}

  getCapabilities() {
    return {
      services: [
        { id: 'proposal', endpoint: '/api/ai/proposal', description: 'Generate deal/project proposals' },
        { id: 'pitch', endpoint: '/api/ai/pitch', description: 'Draft outreach pitches' },
        { id: 'email', endpoint: '/api/ai/email', description: 'Draft operational emails' },
      ],
      stub: true,
      llmConfigured: Boolean(process.env.OPENAI_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim()),
    };
  }

  generateProposal(input: AiProposalRequest) {
    return this.proposalGenerator.generate(input);
  }

  writePitch(input: AiPitchRequest) {
    return this.pitchWriter.write(input);
  }

  writeEmail(input: AiEmailRequest) {
    return this.emailWriter.write(input);
  }
}
