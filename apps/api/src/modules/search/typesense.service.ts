import { Injectable } from '@nestjs/common';

export type TypesenseHealth = {
  configured: boolean;
  status: 'ok' | 'degraded' | 'unavailable';
  host: string | null;
};

@Injectable()
export class TypesenseService {
  isConfigured(): boolean {
    return Boolean(
      process.env.TYPESENSE_HOST?.trim() && process.env.TYPESENSE_API_KEY?.trim(),
    );
  }

  getHealth(): TypesenseHealth {
    const configured = this.isConfigured();
    return {
      configured,
      status: configured ? 'ok' : 'degraded',
      host: process.env.TYPESENSE_HOST?.trim() ?? null,
    };
  }

  async search(query: string, limit = 20) {
    if (!this.isConfigured()) {
      return {
        query,
        hits: [],
        stub: true,
        message: 'Typesense not configured — set TYPESENSE_HOST and TYPESENSE_API_KEY',
      };
    }

    // Stub: real Typesense client wiring lands in P2 hardening
    return {
      query,
      hits: [],
      stub: true,
      message: 'Typesense client scaffold — index sync not yet implemented',
      limit,
    };
  }
}
