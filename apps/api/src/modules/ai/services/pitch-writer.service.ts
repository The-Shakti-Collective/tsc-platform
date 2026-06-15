import { Injectable } from '@nestjs/common';
import type { AiPitchRequest } from '../schema';

@Injectable()
export class PitchWriterService {
  write(input: AiPitchRequest) {
    const points = input.keyPoints.length
      ? input.keyPoints.map((p) => `- ${p}`).join('\n')
      : '- Highlight unique value proposition';

    return {
      subject: input.subject,
      hook: `[Stub] Opening hook tailored for ${input.audience ?? 'general audience'}.`,
      body: `Pitch outline:\n${points}`,
      callToAction: 'Schedule a follow-up conversation.',
      stub: true,
      generatedAt: new Date().toISOString(),
    };
  }
}
