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

const isValidPosthogKey = (key) => {
  if (!key?.trim()) return false;
  if (/REPLACE_ME|placeholder|xxx/i.test(key)) return false;
  return key.startsWith('phc_');
};

const resolvePosthogHost = () => {
  const configured = import.meta.env.VITE_POSTHOG_HOST?.trim();
  if (!configured) return 'https://us.i.posthog.com';
  try {
    const url = new URL(configured);
    if (!/\.i\.posthog\.com$/i.test(url.hostname)) return 'https://us.i.posthog.com';
    return url.origin;
  } catch {
    return 'https://us.i.posthog.com';
  }
};

/** Product analytics — no-op when VITE_POSTHOG_KEY is unset. */
export const initPosthog = () => {
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim();
  if (!isValidPosthogKey(key) || initialized) return;

  loadPosthog()
    .then((posthog) => {
      if (!posthog) return;
      posthog.init(key, {
        api_host: resolvePosthogHost(),
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
