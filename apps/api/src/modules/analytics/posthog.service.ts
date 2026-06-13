import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PostHog } from 'posthog-node';

@Injectable()
export class PosthogService implements OnModuleDestroy {
  private readonly client: PostHog | null;
  private readonly enabled: boolean;

  constructor() {
    const token =
      process.env.POSTHOG_PROJECT_TOKEN ?? process.env.POSTHOG_API_KEY ?? '';
    this.enabled = token.length > 0;

    if (!this.enabled) {
      this.client = null;
      return;
    }

    this.client = new PostHog(token, {
      host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
    });
  }

  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }): void {
    this.client?.capture(params);
  }

  identify(params: {
    distinctId: string;
    properties?: Record<string, unknown>;
  }): void {
    this.client?.identify(params);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
