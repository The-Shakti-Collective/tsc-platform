import { isAuthStubEnabled, isClerkConfigured } from '@/lib/clerk-env';
import { StubAuthPage } from '@/components/auth/stub-auth-page';
import { ClerkSignUpPage } from './clerk-sign-up-page';

export default function SignUpPage() {
  if (isAuthStubEnabled()) {
    return <StubAuthPage mode="sign-up" />;
  }

  if (!isClerkConfigured()) {
    return <StubAuthPage mode="sign-up" productionFallback />;
  }

  return <ClerkSignUpPage />;
}
