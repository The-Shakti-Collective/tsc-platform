import { Injectable } from '@nestjs/common';
import type {
  IntegrationConnectionCreateInput,
  IntegrationListQuery,
} from './schema';
import { IntegrationsRepository } from './integrations.repository';

const OAUTH_PROVIDERS = ['google', 'meta', 'spotify', 'youtube'] as const;

@Injectable()
export class IntegrationsService {
  constructor(private readonly repository: IntegrationsRepository) {}

  getOAuthReadiness() {
    const checks = {
      google: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
      meta: Boolean(process.env.META_APP_ID?.trim()),
      spotify: Boolean(process.env.SPOTIFY_CLIENT_ID?.trim()),
      youtube: Boolean(process.env.YOUTUBE_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim()),
      resend: Boolean(process.env.RESEND_API_KEY?.trim()),
      distrokid: Boolean(process.env.DISTROKID_API_KEY?.trim()),
    };

    const ready = Object.values(checks).some(Boolean);

    return {
      ready,
      providers: checks,
      oauthProviders: OAUTH_PROVIDERS,
      stub: !ready,
    };
  }

  listConnections(query: IntegrationListQuery) {
    return this.repository
      .list(query.organizationId, query.provider)
      .then((items) => ({ items }));
  }

  createConnection(input: IntegrationConnectionCreateInput) {
    return this.repository.create(input);
  }
}
