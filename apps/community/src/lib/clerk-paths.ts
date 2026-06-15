import { withBasePath } from '@/lib/app-urls';

/** Clerk auth paths — must include Next.js basePath in production (/community). */
export function getClerkSignInUrl(): string {
  return process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim() || withBasePath('/sign-in');
}

export function getClerkSignUpUrl(): string {
  return process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim() || withBasePath('/sign-up');
}

export function getClerkAfterSignInUrl(): string {
  return process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?.trim() || withBasePath('/onboarding');
}

export function getClerkAfterSignUpUrl(): string {
  return process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?.trim() || withBasePath('/onboarding');
}
