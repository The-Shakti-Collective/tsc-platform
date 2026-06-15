import { forwardToTaskmaster as postToTaskmaster, resolveWebhookUrl } from './taskmasterWebhook';

function resolveArtistEnquiryWebhookUrl(): string {
  const explicit = (process.env.TASKMASTER_ARTIST_ENQUIRY_WEBHOOK_URL || '').trim();
  if (explicit) return explicit;

  const bookCallUrl = (process.env.TASKMASTER_WEBHOOK_URL || process.env.CRM_WEBHOOK_URL || '').trim();
  if (bookCallUrl) {
    return bookCallUrl.replace(/book-call\/?$/, 'artist-enquiry');
  }

  return resolveWebhookUrl('TASKMASTER_ARTIST_ENQUIRY_WEBHOOK_URL', '/api/webhooks/artist-enquiry');
}

export async function forwardToTaskmasterEnquiry(data: Record<string, unknown>): Promise<void> {
  const secret = process.env.ARTIST_ENQUIRY_WEBHOOK_SECRET;

  const { ok, status, body } = await postToTaskmaster({
    url: resolveArtistEnquiryWebhookUrl(),
    secret,
    payload: data,
  });

  if (!ok) {
    console.error('[artist-enquiry] Taskmaster forward non-OK', status, body);
  }
}

/** @deprecated use forwardToTaskmasterEnquiry */
export const forwardToTaskmaster = forwardToTaskmasterEnquiry;

export function buildTaskmasterEnquiryPayload(data: Record<string, string>): Record<string, unknown> {
  return {
    source: 'tsc-website',
    sourceSite: 'tsc-website',
    name: data.name,
    email: data.email,
    phone: data.phone,
    artist: data.artist,
    organization: data.company,
    company: data.company,
    collaborationType: data.collabType,
    engagementType: data.collabType,
    nature: data.nature,
    projectNature: data.nature,
    whenWhere: data.locationTime,
    whenAndWhere: data.locationTime,
    scaleReach: data.scale,
    scale: data.scale,
    logistics: data.logisticsSupport,
    logisticsSupport: data.logisticsSupport,
    vision: data.additionalVision,
    extraVision: data.additionalVision,
    details: data.additionalVision,
  };
}
