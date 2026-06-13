import { Navigate, useLocation } from 'react-router-dom';

import { SignedIn, SignedOut } from '@clerk/clerk-react';

import { isAuthStubEnabled } from '../../lib/clerkEnv';

export function ProtectedRoute({ children }) {
  const location = useLocation();

  if (isAuthStubEnabled()) {
    return children;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
      </SignedOut>
    </>
  );
}
