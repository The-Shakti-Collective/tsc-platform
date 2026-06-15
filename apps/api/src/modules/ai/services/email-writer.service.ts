import { Injectable } from '@nestjs/common';
import type { AiEmailRequest } from '../schema';

@Injectable()
export class EmailWriterService {
  write(input: AiEmailRequest) {
    const bullets = input.bulletPoints.length
      ? input.bulletPoints.map((p) => `• ${p}`).join('\n')
      : '• [Stub] Add key message here';

    return {
      subject: `[Stub] Re: ${input.purpose}`,
      body: `Hi${input.recipientRole ? ` ${input.recipientRole}` : ''},\n\n${bullets}\n\nBest,\nCoreKnot Copilot`,
      stub: true,
      generatedAt: new Date().toISOString(),
    };
  }
}
