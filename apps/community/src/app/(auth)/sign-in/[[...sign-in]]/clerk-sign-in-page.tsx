import { SignIn } from '@clerk/nextjs';
import {
  getClerkAfterSignInUrl,
  getClerkSignInUrl,
  getClerkSignUpUrl,
} from '@/lib/clerk-paths';

export function ClerkSignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <SignIn
        routing="path"
        path={getClerkSignInUrl()}
        signUpUrl={getClerkSignUpUrl()}
        fallbackRedirectUrl={getClerkAfterSignInUrl()}
      />
    </div>
  );
}
