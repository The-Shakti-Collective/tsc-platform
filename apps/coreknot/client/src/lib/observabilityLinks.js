/**
 * Public dashboard URLs for external observability tools (no secrets).
 * Override via VITE_* env; defaults target The Shakti Collective org links.
 */

const SENTRY_ORG_SLUG = 'the-shakti-collective';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

function trimEnv(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function posthogAppHost(ingestHost) {
  const host = ingestHost || 'https://us.i.posthog.com';
  try {
    const url = new URL(host);
    if (url.hostname.startsWith('us.i.')) {
      url.hostname = url.hostname.replace('us.i.', 'us.');
    } else if (url.hostname.startsWith('eu.i.')) {
      url.hostname = url.hostname.replace('eu.i.', 'eu.');
    } else {
      url.hostname = url.hostname.replace('.i.', '.');
    }
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return 'https://us.posthog.com';
  }
}

function resolvePostHogLink() {
  const override = trimEnv(env.VITE_POSTHOG_PROJECT_URL);
  if (override) {
    return { url: override, configured: true, showSetupBadge: false, source: 'override' };
  }

  const projectId = trimEnv(env.VITE_POSTHOG_PROJECT_ID);
  const hasKey = !!trimEnv(env.VITE_POSTHOG_KEY);
  const appHost = posthogAppHost(trimEnv(env.VITE_POSTHOG_HOST));

  if (projectId) {
    return {
      url: `${appHost}/project/${projectId}`,
      configured: true,
      showSetupBadge: false,
      source: 'derived',
    };
  }

  return {
    url: hasKey ? appHost : `${appHost}/`,
    configured: hasKey,
    showSetupBadge: !hasKey,
    source: hasKey ? 'sdk' : 'default',
  };
}

function resolveSentryLink() {
  const override = trimEnv(env.VITE_SENTRY_ORG_URL);
  if (override) {
    return { url: override, configured: true, showSetupBadge: false, source: 'override' };
  }

  const hasDsn = !!trimEnv(env.VITE_SENTRY_DSN);
  return {
    url: `https://sentry.io/organizations/${SENTRY_ORG_SLUG}/`,
    configured: hasDsn,
    showSetupBadge: !hasDsn,
    source: hasDsn ? 'sdk' : 'default',
  };
}

function resolveBetterStackLink() {
  const override = trimEnv(env.VITE_BETTERSTACK_DASHBOARD_URL);
  if (override) {
    return { url: override, configured: true, showSetupBadge: false, source: 'override' };
  }

  return {
    url: 'https://uptime.betterstack.com/',
    configured: false,
    showSetupBadge: false,
    source: 'default',
  };
}

/** @returns {Array<{ id: string, name: string, description: string, url: string, configured: boolean, showSetupBadge: boolean, setupHint?: string }>} */
export function getObservabilityLinks() {
  const posthog = resolvePostHogLink();
  const sentry = resolveSentryLink();
  const betterstack = resolveBetterStackLink();
  const devNeedsRestart = !!env.DEV;

  return [
    {
      id: 'sentry',
      name: 'Sentry',
      description: 'Errors & performance',
      url: sentry.url,
      configured: sentry.configured,
      showSetupBadge: sentry.showSetupBadge !== false,
      setupHint: devNeedsRestart
        ? 'Add VITE_SENTRY_DSN in client/.env.local, then restart Vite'
        : 'Add VITE_SENTRY_DSN in client/.env.local',
    },
    {
      id: 'posthog',
      name: 'PostHog',
      description: 'Product analytics',
      url: posthog.url,
      configured: posthog.configured,
      showSetupBadge: posthog.showSetupBadge !== false,
      setupHint: devNeedsRestart
        ? 'Add VITE_POSTHOG_KEY in client/.env.local, then restart Vite'
        : 'Add VITE_POSTHOG_KEY in client/.env.local',
    },
    {
      id: 'betterstack',
      name: 'BetterStack',
      description: 'Uptime & heartbeats',
      url: betterstack.url,
      configured: betterstack.configured,
      showSetupBadge: betterstack.showSetupBadge === true,
    },
  ];
}

export function hasConfiguredObservabilityLinks() {
  return getObservabilityLinks().some((link) => link.configured);
}
