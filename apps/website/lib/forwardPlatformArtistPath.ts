import { buildArtistPathPayload } from '@/lib/taskmasterWebhook';

function resolvePlatformApiUrl(): string | null {
  const raw = (process.env.TSC_API_URL || process.env.PLATFORM_API_URL || '').trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

function toPlatformBody(data: Record<string, unknown>) {
  const payload = buildArtistPathPayload(data);
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const fullName = String(payload.fullName || `${firstName} ${lastName}`).trim();

  return {
    fullName,
    email: String(payload.email || '').trim(),
    phone: String(payload.mobile || '').trim(),
    city: String(payload.place || '').trim(),
    stageName: String(payload.stageName || '').trim(),
    instagram: String(payload.instagram || '').trim(),
    spotify: String(payload.spotify || '').trim(),
    youtube: String(payload.youtube || '').trim(),
    artistIdentity: String(payload.artistIdentity || '').trim(),
    trainingDetails: String(payload.trainingDetails || '').trim(),
    coreSkills: String(payload.coreSkills || '').trim(),
    strengthsUniqueness: String(payload.strengthsUniqueness || '').trim(),
    dailyTime: String(payload.dailyTime || '').trim(),
    mentorName: String(payload.mentorName || '').trim(),
    songsReleased: String(payload.songsReleased || '').trim(),
    showsPerformed: String(payload.showsPerformed || '').trim(),
    currentFans: String(payload.currentFans || '').trim(),
    currentSetup: String(payload.currentSetup || '').trim(),
    currentlyWorkingOn: String(payload.currentlyWorkingOn || '').trim(),
    dailyRituals: String(payload.dailyRituals || '').trim(),
    learningNeeds: String(payload.learningNeeds || '').trim(),
    mentorshipNeeds: String(payload.mentorshipNeeds || '').trim(),
    curationNeeds: String(payload.curationNeeds || '').trim(),
    fandomNeeds: String(payload.fandomNeeds || '').trim(),
    aspirationalGoal: String(payload.aspirationalGoal || '').trim(),
    anythingElse: String(payload.anythingElse || '').trim(),
    source: 'theshakticollective.in/artist-path',
  };
}

export async function forwardToPlatformArtistPath(
  data: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; body: unknown; skipped?: boolean }> {
  const apiBase = resolvePlatformApiUrl();
  const secret = (process.env.ARTIST_PATH_WEBHOOK_SECRET || '').trim();

  if (!apiBase || !secret) {
    return { ok: false, status: 0, body: { error: 'Platform API not configured' }, skipped: true };
  }

  const res = await fetch(`${apiBase}/public/artist-path/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Artist-Path-Secret': secret,
    },
    body: JSON.stringify(toPlatformBody(data)),
  });

  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}
