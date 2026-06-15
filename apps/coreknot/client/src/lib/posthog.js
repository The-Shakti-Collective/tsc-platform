let posthogModule = null;
let initialized = false;

const loadPosthog = async () => {
  if (posthogModule) return posthogModule;
  try {
    posthogModule = await import('posthog-js');
    return posthogModule.default || posthogModule;
  } catch {
    return null;
  }
};

/** Product analytics — no-op when VITE_POSTHOG_KEY is unset. */
export const initPosthog = () => {
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim();
  if (!key || initialized) return;

  loadPosthog()
    .then((posthog) => {
      if (!posthog) return;
      posthog.init(key, {
        api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
      });
      initialized = true;
    })
    .catch(() => {});
};

export const isPosthogEnabled = () => initialized;

/** SPA route change — manual $pageview (React Router). */
export const capturePosthogPageview = () => {
  if (!initialized) return;
  loadPosthog()
    .then((posthog) => {
      if (posthog) posthog.capture('$pageview');
    })
    .catch(() => {});
};

export const capturePosthogEvent = (event, properties) => {
  if (!initialized) return;
  loadPosthog()
    .then((posthog) => {
      if (posthog) posthog.capture(event, properties);
    })
    .catch(() => {});
};

export const setPosthogUser = (user) => {
  if (!initialized || !user) return;
  const id = String(user._id || user.id || '');
  if (!id) return;
  loadPosthog()
    .then((posthog) => {
      if (!posthog) return;
      posthog.identify(id, {
        email: user.email || undefined,
        name: user.name || user.username || undefined,
        role: user.role || undefined,
      });
    })
    .catch(() => {});
};

export const clearPosthogUser = () => {
  if (!initialized) return;
  loadPosthog()
    .then((posthog) => {
      if (posthog) posthog.reset();
    })
    .catch(() => {});
};
