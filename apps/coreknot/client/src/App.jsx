import { Suspense, useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { appRoutes } from './routes';
import { setApiTokenGetter } from './lib/apiClient';
import { isAuthStubEnabled } from './lib/clerkEnv';
import { Spinner } from './components/ui/Spinner';

const STUB_USER_ID = import.meta.env.VITE_STUB_USER_ID?.trim() || 'stub-dev-user';

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

function ClerkApiTokenBridge() {
  const auth = useAuth();

  useEffect(() => {
    setApiTokenGetter(() => auth.getToken());
  }, [auth]);

  return null;
}

export default function App() {
  const stubEnabled = isAuthStubEnabled();
  const element = useRoutes(appRoutes);

  useEffect(() => {
    if (stubEnabled) {
      setApiTokenGetter(async () => `stub:${STUB_USER_ID}`);
    }
  }, [stubEnabled]);

  return (
    <Suspense fallback={<RouteFallback />}>
      {!stubEnabled ? <ClerkApiTokenBridge /> : null}
      {element}
    </Suspense>
  );
}
