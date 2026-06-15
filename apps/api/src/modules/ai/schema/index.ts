import { z } from 'zod';

export const AiProposalRequestSchema = z.object({
  context: z.string().min(1),
  artistId: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'persuasive']).default('professional'),
});

export const AiPitchRequestSchema = z.object({
  subject: z.string().min(1),
  audience: z.string().optional(),
  keyPoints: z.array(z.string()).default([]),
});

export const AiEmailRequestSchema = z.object({
  purpose: z.string().min(1),
  recipientRole: z.string().optional(),
  bulletPoints: z.array(z.string()).default([]),
});

export type AiProposalRequest = z.infer<typeof AiProposalRequestSchema>;
export type AiPitchRequest = z.infer<typeof AiPitchRequestSchema>;
export type AiEmailRequest = z.infer<typeof AiEmailRequestSchema>;
