export const BOOKING_REQUEST_STATUSES = [
  'inquiry',
  'matched',
  'negotiating',
  'contracted',
  'completed',
  'cancelled',
] as const;

export type BookingRequestStatus = (typeof BOOKING_REQUEST_STATUSES)[number];

export interface BookingRequestSummary {
  id: string;
  requesterPersonId: string;
  requesterName: string | null;
  artistId: string;
  artistName: string | null;
  venueId: string | null;
  venueName: string | null;
  eventDate: string | null;
  budget: number | null;
  message: string | null;
  status: BookingRequestStatus;
  dealId: string | null;
  opportunityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequestListPayload {
  items: BookingRequestSummary[];
  filters: {
    artistId: string | null;
    status: BookingRequestStatus | null;
  };
  updatedAt: string;
}

export interface BookingRequestCreatedPayload {
  id: string;
  status: BookingRequestStatus;
  artistId: string;
  automationRunId?: string | null;
  opportunityId?: string | null;
  createdAt: string;
}

export interface BookingRequestStatusUpdatePayload {
  id: string;
  status: BookingRequestStatus;
  previousStatus: BookingRequestStatus;
  updatedAt: string;
}

export interface BookingConvertToDealPayload {
  bookingRequestId: string;
  dealId: string;
  opportunityId: string;
  status: BookingRequestStatus;
}
