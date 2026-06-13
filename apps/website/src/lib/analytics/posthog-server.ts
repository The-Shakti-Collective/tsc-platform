import { PostHog } from 'posthog-node';
import { siteConfig } from '@/lib/config/site';

let client: PostHog | null = null;

function getPosthogClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return null;

  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    });
  }

  return client;
}

export async function captureServerEvent(
  event: string,
  properties: Record<string, unknown>,
  distinctId: string,
): Promise<boolean> {
  const posthog = getPosthogClient();
  if (!posthog) return false;

  posthog.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      source: 'tsc-website',
      site_url: siteConfig.url,
    },
  });

  await posthog.shutdown();
  client = null;
  return true;
}

export function isPosthogConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}
