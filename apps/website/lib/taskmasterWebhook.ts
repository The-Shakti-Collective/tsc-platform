import crypto from 'crypto';

/** Production CoreKnot API — website webhooks target this host. */
export const PRODUCTION_COREKNOT_HOST = 'https://api.coreknot.in';

function resolveApiBase(): string {
  const configured = (
    process.env.COREKNOT_API_URL ||
    process.env.TASKMASTER_BASE_URL ||
    ''
  ).trim();
  if (configured) return configured.replace(/\/$/, '');

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_COREKNOT_HOST;
  }

  return 'http://127.0.0.1:5000';
}

export function resolveWebhookUrl(envKey: string, defaultPath: string): string {
  const configured = (process.env[envKey] || '').trim();
  if (configured) {
    if (configured.startsWith('http')) return configured;
    return `${resolveApiBase()}${configured.startsWith('/') ? configured : `/${configured}`}`;
  }

  return `${resolveApiBase()}${defaultPath}`;
}

export function computeWebhookSignature(rawBody: string, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}

export async function forwardToTaskmaster({
  url,
  secret,
  payload,
  useHmac = false,
}: {
  url: string;
  secret?: string;
  payload: Record<string, unknown>;
  useHmac?: boolean;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (secret) {
    if (useHmac) {
      headers['X-Webhook-Signature'] = computeWebhookSignature(body, secret);
    } else {
      headers['X-Webhook-Secret'] = secret;
    }
  }

  const res = await fetch(url, { method: 'POST', headers, body });
  const parsed = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: parsed };
}

export function buildArtistPathPayload(data: Record<string, unknown>): Record<string, unknown> {
  const firstName = String(data.firstName || '').trim();
  const lastName = String(data.lastName || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    source: 'tsc-website',
    sourceSite: 'tsc-website',
    firstName,
    lastName,
    fullName,
    stageName: data.stageName,
    place: data.place,
    instagram: data.instagram,
    spotify: data.spotify,
    youtube: data.youtube,
    mobile: data.mobile,
    email: data.email,
    artistIdentity: data.artistIdentity,
    trainingDetails: data.trainingDetails,
    coreSkills: data.coreSkills,
    strengthsUniqueness: data.strengthsUniqueness,
    dailyTime: data.dailyTime,
    mentorName: data.mentorName,
    songsReleased: data.songsReleased,
    showsPerformed: data.showsPerformed,
    currentFans: data.currentFans,
    currentSetup: data.currentSetup,
    currentlyWorkingOn: data.currentlyWorkingOn,
    dailyRituals: data.dailyRituals,
    learningNeeds: data.learningNeeds,
    mentorshipNeeds: data.mentorshipNeeds,
    curationNeeds: data.curationNeeds,
    fandomNeeds: data.fandomNeeds,
    aspirationalGoal: data.aspirationalGoal,
    anythingElse: data.anythingElse,
  };
}

export function buildMasterclassReviewPayload(
  data: Record<string, unknown>,
  campaign: 'review01' | 'review02',
): Record<string, unknown> {
  return {
    ...data,
    source: 'tsc-website',
    sourceSite: 'tsc-website',
    campaign,
  };
}

/** @deprecated use PRODUCTION_COREKNOT_HOST */
export const PRODUCTION_TASKMASTER_HOST = PRODUCTION_COREKNOT_HOST;
