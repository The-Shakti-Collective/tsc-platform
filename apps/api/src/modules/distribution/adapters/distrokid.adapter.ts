import { Injectable } from '@nestjs/common';

/** DistroKid integration stub — replace with real API when credentials are configured. */
@Injectable()
export class DistrokidAdapter {
  isConfigured(): boolean {
    return Boolean(process.env.DISTROKID_API_KEY?.trim());
  }

  async submitRelease(payload: {
    title: string;
    upc?: string;
    isrc?: string;
  }): Promise<{
    externalId: string;
    status: string;
    stub: true;
    title: string;
    upc?: string;
    isrc?: string;
  }> {
    return {
      externalId: `distrokid_stub_${Date.now()}`,
      status: this.isConfigured() ? 'queued' : 'not_configured',
      stub: true,
      ...payload,
    };
  }
}
