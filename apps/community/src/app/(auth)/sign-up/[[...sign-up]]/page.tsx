import { isAuthStubEnabled } from '@/lib/clerk-env';
import { StubAuthPage } from '@/components/auth/stub-auth-page';
import { ClerkSignUpPage } from './clerk-sign-up-page';

export default function SignUpPage() {
  if (isAuthStubEnabled()) {
    return <StubAuthPage mode="sign-up" />;
  }

  return <ClerkSignUpPage />;
}
