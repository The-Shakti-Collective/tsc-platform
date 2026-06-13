/**
 * checkJs: default outlet context and route params for workspace shell pages.
 */
import type { Params } from 'react-router-dom';

declare module 'react-router-dom' {
  interface WorkspaceOutletContext {
    workspace?: {
      slug?: string;
      name?: string;
      id?: string;
      type?: string;
      memberCount?: number;
      teamCount?: number;
      teams?: unknown[];
      members?: unknown[];
    };
  }

  export function useOutletContext<T = WorkspaceOutletContext>(): T;
}

declare global {
  type CoreKnotRouteParams = Params<'artistId' | 'communityId' | 'slug' | 'tenantSlug' | 'dealId' | 'brandId' | 'collaborationId' | 'opportunityId' | 'projectSlug'>;
}

export {};
