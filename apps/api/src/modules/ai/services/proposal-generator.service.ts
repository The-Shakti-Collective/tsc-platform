import { Injectable } from '@nestjs/common';
import type { AiProposalRequest } from '../schema';

@Injectable()
export class ProposalGeneratorService {
  generate(input: AiProposalRequest) {
    return {
      title: `Proposal: ${input.context.slice(0, 60)}`,
      summary: `[Stub] Generated proposal for context with ${input.tone} tone.`,
      sections: [
        { heading: 'Overview', body: input.context },
        { heading: 'Next steps', body: 'Review with artist management and finalize terms.' },
      ],
      stub: true,
      generatedAt: new Date().toISOString(),
    };
  }
}
