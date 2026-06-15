import type {
  EcosystemPassportPayload,
  MarketplaceListingDetail,
  MarketplaceListingsPayload,
  PersonCoreSummary,
  PersonProfileEditInput,
  PersonProfileRecord,
  UsernameCheckPayload,
  VerificationPayload,
} from '@tsc/types';

export interface CommunitySdkOptions {
  baseUrl: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  fetchImpl?: typeof fetch;
}

export class CommunityApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: CommunitySdkOptions['getAuthToken'];
  private readonly fetchImpl: typeof fetch;

  constructor(options: CommunitySdkOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.getAuthToken = options.getAuthToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    const token = this.getAuthToken ? await this.getAuthToken() : null;
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Community API ${response.status}: ${text || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  getPublicProfileBySlug(slug: string) {
    return this.request<PersonProfileRecord>(`/profile/${slug}/public`);
  }

  getEcosystemPassport(slug: string) {
    return this.request<EcosystemPassportPayload>(`/profile/${slug}/ecosystem`);
  }

  getMyProfile() {
    return this.request<PersonProfileRecord>('/profile/me');
  }

  updateMyProfile(input: PersonProfileEditInput) {
    return this.request<PersonProfileRecord>('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  checkUsername(username: string) {
    return this.request<UsernameCheckPayload>('/profile/username/check', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  getVerification(personId: string) {
    return this.request<VerificationPayload>(`/profile/${personId}/verification`);
  }

  getPerson(personId: string) {
    return this.request<PersonCoreSummary>(`/identity/persons/${personId}`);
  }

  getPersonByUsername(username: string) {
    return this.request<PersonCoreSummary & { profileSlug: string | null }>(
      `/identity/persons/by-username/${encodeURIComponent(username)}`,
    );
  }

  listMarketplaceListings(query?: { limit?: number; city?: string; type?: string }) {
    const params = new URLSearchParams();
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.city) params.set('city', query.city);
    if (query?.type) params.set('type', query.type);
    const qs = params.toString();
    return this.request<MarketplaceListingsPayload>(
      `/marketplace/listings${qs ? `?${qs}` : ''}`,
    );
  }

  getMarketplaceListing(id: string) {
    return this.request<MarketplaceListingDetail>(`/marketplace/listings/${id}`);
  }

  getCurrentUser() {
    return this.request<{
      id?: string;
      clerkUserId: string;
      personId?: string;
      platformRole: string;
      provisioned: boolean;
    }>('/users/me');
  }
}

export function createCommunityClient(options: CommunitySdkOptions) {
  return new CommunityApiClient(options);
}


