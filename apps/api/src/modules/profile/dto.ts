import { z } from 'zod';
import {
  AdminVerificationPatchSchema,
  CommunityVerificationRequestSchema,
  ProfileEditSchema,
  UsernameCheckSchema,
} from '@tsc/contracts/profile';

export {
  AdminVerificationPatchSchema,
  CommunityVerificationRequestSchema,
  ProfileEditSchema,
  UsernameCheckSchema,
};

export type ProfileEditInput = z.infer<typeof ProfileEditSchema>;
export type UsernameCheckInput = z.infer<typeof UsernameCheckSchema>;
export type CommunityVerificationRequestInput = z.infer<
  typeof CommunityVerificationRequestSchema
>;
export type AdminVerificationPatchInput = z.infer<
  typeof AdminVerificationPatchSchema
>;
