import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { capturePosthogPageview } from '../lib/posthog';

/** Fires $pageview on React Router navigations (SPA). */
export default function PosthogRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    capturePosthogPageview();
  }, [location.pathname, location.search]);

  return null;
}
