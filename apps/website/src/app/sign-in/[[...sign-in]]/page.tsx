import { isAuthStubEnabled } from '@/lib/clerk-env';
import { StubAuthPage } from '@/components/auth/stub-auth-page';
import { ClerkSignInPage } from './clerk-sign-in-page';

export default function SignInPage() {
  if (isAuthStubEnabled()) {
    return <StubAuthPage mode="sign-in" />;
  }

  return <ClerkSignInPage />;
}
