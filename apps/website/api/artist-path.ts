import type { VercelRequest, VercelResponse } from '@vercel/node';

function platformBase(): string {
  const raw = (process.env.TSC_API_URL || process.env.PLATFORM_API_URL || 'http://127.0.0.1:4000').trim();
  return raw.replace(/\/$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const secret = (process.env.ARTIST_PATH_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return res.status(503).json({ success: false, error: 'ARTIST_PATH_WEBHOOK_SECRET not configured' });
  }

  try {
    const body = req.body as Record<string, unknown>;
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const platformBody = {
      fullName: `${firstName} ${lastName}`.trim(),
      email: String(body.email || '').trim(),
      phone: String(body.mobile || '').trim(),
      city: String(body.place || '').trim(),
      stageName: String(body.stageName || '').trim(),
      instagram: String(body.instagram || '').trim(),
      spotify: String(body.spotify || '').trim(),
      youtube: String(body.youtube || '').trim(),
      artistIdentity: String(body.artistIdentity || '').trim(),
      trainingDetails: String(body.trainingDetails || '').trim(),
      coreSkills: String(body.coreSkills || '').trim(),
      strengthsUniqueness: String(body.strengthsUniqueness || '').trim(),
      dailyTime: String(body.dailyTime || '').trim(),
      mentorName: String(body.mentorName || '').trim(),
      songsReleased: String(body.songsReleased || '').trim(),
      showsPerformed: String(body.showsPerformed || '').trim(),
      currentFans: String(body.currentFans || '').trim(),
      currentSetup: String(body.currentSetup || '').trim(),
      currentlyWorkingOn: String(body.currentlyWorkingOn || '').trim(),
      dailyRituals: String(body.dailyRituals || '').trim(),
      learningNeeds: String(body.learningNeeds || '').trim(),
      mentorshipNeeds: String(body.mentorshipNeeds || '').trim(),
      curationNeeds: String(body.curationNeeds || '').trim(),
      fandomNeeds: String(body.fandomNeeds || '').trim(),
      aspirationalGoal: String(body.aspirationalGoal || '').trim(),
      anythingElse: String(body.anythingElse || '').trim(),
      source: 'theshakticollective.in/artist-path',
    };

    const platformRes = await fetch(`${platformBase()}/public/artist-path/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Artist-Path-Secret': secret,
      },
      body: JSON.stringify(platformBody),
    });
    const json = await platformRes.json().catch(() => ({}));
    if (!platformRes.ok) {
      return res.status(platformRes.status).json({
        success: false,
        error: (json as { message?: string }).message || (json as { error?: string }).error || 'Platform API failed',
      });
    }
    return res.status(200).json({ success: true, message: 'Successfully submitted', platformStored: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ success: false, error: message });
  }
}
