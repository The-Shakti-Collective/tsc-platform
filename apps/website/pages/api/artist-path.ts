import type { NextApiRequest, NextApiResponse } from 'next';
import { forwardToPlatformArtistPath } from '@/lib/forwardPlatformArtistPath';
import { buildArtistPathPayload, forwardToTaskmaster, resolveWebhookUrl } from '@/lib/taskmasterWebhook';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body as Record<string, unknown>;
    const { firstName, lastName, ...data } = body;
    const payload = buildArtistPathPayload({ firstName, lastName, ...data });

    const platform = await forwardToPlatformArtistPath(body);
    const taskmaster = await forwardToTaskmaster({
      url: resolveWebhookUrl('TASKMASTER_ARTIST_PATH_WEBHOOK_URL', '/api/webhooks/artist-path'),
      secret: process.env.ARTIST_PATH_WEBHOOK_SECRET,
      payload,
    });

    const platformConfigured = !platform.skipped;
    const platformOk = platform.ok;
    const taskmasterOk = taskmaster.ok;

    if (platformConfigured) {
      if (!platformOk) {
        const err =
          (platform.body as { message?: string; error?: string })?.message ||
          (platform.body as { error?: string })?.error ||
          `Platform API failed (${platform.status})`;
        throw new Error(err);
      }
      if (!taskmasterOk) {
        console.warn('[artist-path] Taskmaster sync failed after Platform success:', taskmaster.status);
      }
      return res.status(200).json({
        success: true,
        message: 'Successfully submitted',
        platformStored: true,
        taskmasterSynced: taskmasterOk,
      });
    }

    if (!taskmasterOk) {
      const err =
        (taskmaster.body as { error?: string })?.error ||
        `Artist path sync failed (${taskmaster.status})`;
      throw new Error(err);
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully submitted',
      platformStored: false,
      taskmasterSynced: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[artist-path] submission failed:', message);
    return res.status(500).json({ success: false, error: message });
  }
}
