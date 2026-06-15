import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PosthogService } from '../modules/analytics/posthog.service';

@Injectable()
export class ObservabilityInitService implements OnModuleInit {
  private readonly logger = new Logger(ObservabilityInitService.name);

  constructor(private readonly posthog: PosthogService) {}

  onModuleInit(): void {
    const sentryEnabled = Boolean(process.env.SENTRY_DSN?.trim());
    const posthogEnabled = Boolean(
      process.env.POSTHOG_PROJECT_TOKEN?.trim() || process.env.POSTHOG_API_KEY?.trim(),
    );
    const betterstackEnabled = Boolean(process.env.BETTERSTACK_HEARTBEAT_URL?.trim());

    this.logger.log(
      `Observability ready — sentry=${sentryEnabled} posthog=${posthogEnabled} betterstack=${betterstackEnabled}`,
    );

    if (posthogEnabled) {
      this.posthog.capture({
        distinctId: 'platform-api',
        event: 'platform_api_started',
        properties: {
          nodeEnv: process.env.NODE_ENV ?? 'development',
          sentry: sentryEnabled,
          betterstack: betterstackEnabled,
        },
      });
    }
  }
}
