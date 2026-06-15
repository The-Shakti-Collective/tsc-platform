import { z } from 'zod';

const optionalText = z.string().trim().max(4000).optional().or(z.literal(''));

export const ArtistPathApplicationSubmitSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(8).max(32),
  city: z.string().trim().max(200).optional(),
  stageName: optionalText,
  instagram: optionalText,
  spotify: optionalText,
  youtube: optionalText,
  artistIdentity: optionalText,
  trainingDetails: optionalText,
  coreSkills: optionalText,
  strengthsUniqueness: optionalText,
  dailyTime: optionalText,
  mentorName: optionalText,
  songsReleased: optionalText,
  showsPerformed: optionalText,
  currentFans: optionalText,
  currentSetup: optionalText,
  currentlyWorkingOn: optionalText,
  dailyRituals: optionalText,
  learningNeeds: optionalText,
  mentorshipNeeds: optionalText,
  curationNeeds: optionalText,
  fandomNeeds: optionalText,
  aspirationalGoal: optionalText,
  anythingElse: optionalText,
  source: z.string().trim().max(120).optional(),
});

export const ArtistPathApplicationListQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
  search: z.string().trim().max(200).optional(),
});

export type ArtistPathApplicationSubmitInput = z.infer<typeof ArtistPathApplicationSubmitSchema>;
