import { SignUp } from '@clerk/nextjs';
import {
  getClerkAfterSignUpUrl,
  getClerkSignInUrl,
  getClerkSignUpUrl,
} from '@/lib/clerk-paths';

export function ClerkSignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <SignUp
        routing="path"
        path={getClerkSignUpUrl()}
        signInUrl={getClerkSignInUrl()}
        fallbackRedirectUrl={getClerkAfterSignUpUrl()}
      />
    </div>
  );
}
