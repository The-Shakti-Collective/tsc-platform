import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClerkProvider } from '@clerk/clerk-react';

import App from './App.jsx';

import { requireClerkPublishableKey, isAuthStubEnabled } from './lib/clerkEnv';

import { initObservability } from './lib/observability.js';

import './index.css';

initObservability();



const queryClient = new QueryClient({

  defaultOptions: {

    queries: {

      retry: 1,

      refetchOnWindowFocus: false,

      staleTime: 30_000,

    },

  },

});



const stubEnabled = isAuthStubEnabled();
const publishableKey = stubEnabled ? null : requireClerkPublishableKey();

const appTree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {stubEnabled || !publishableKey ? (
      appTree
    ) : (
      <ClerkProvider publishableKey={publishableKey}>{appTree}</ClerkProvider>
    )}
  </StrictMode>,
);

