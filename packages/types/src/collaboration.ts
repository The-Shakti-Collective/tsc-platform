export type CollaborationType =
  | 'need_rapper'
  | 'need_producer'
  | 'need_guitarist'
  | 'need_videographer'
  | 'need_cover_artist'
  | 'general';

export type CollaborationStatus = 'open' | 'filled' | 'closed' | 'expired';

export type CollaborationApplicationStatus =
  | 'applied'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface CollaborationPersonSummary {
  id: string;
  name: string;
  slug: string | null;
}

export interface CollaborationSummary {
  id: string;
  title: string;
  description: string | null;
  type: CollaborationType;
  genres: string[];
  city: string | null;
  status: CollaborationStatus;
  creatorPersonId: string;
  creatorName: string;
  creatorSlug: string | null;
  applicationCount: number;
  createdAt: string;
  expiresAt: string | null;
}

export interface CollaborationApplicationSummary {
  id: string;
  collaborationId: string;
  applicantPersonId: string;
  applicantName: string;
  applicantSlug: string | null;
  message: string | null;
  status: CollaborationApplicationStatus;
  appliedAt: string;
  collaboration?: Pick<
    CollaborationSummary,
    'id' | 'title' | 'type' | 'city' | 'status'
  >;
}

export interface CollaborationBrowsePayload {
  items: CollaborationSummary[];
  filters: {
    type: CollaborationType | null;
    genre: string | null;
    city: string | null;
    status: CollaborationStatus | null;
  };
  updatedAt: string;
}

export interface CollaborationDetail extends CollaborationSummary {
  isCreator: boolean;
  applications: CollaborationApplicationSummary[];
  myApplication: CollaborationApplicationSummary | null;
}

export interface CollaborationCreatedPayload {
  items: CollaborationSummary[];
  updatedAt: string;
}

export interface CollaborationApplicationsPayload {
  items: CollaborationApplicationSummary[];
  updatedAt: string;
}
