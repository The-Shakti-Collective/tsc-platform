import type { NextApiRequest, NextApiResponse } from 'next';
import { forwardToTaskmaster, resolveWebhookUrl } from '@/lib/taskmasterWebhook';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body as { email?: string };

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { ok, status, body } = await forwardToTaskmaster({
      url: resolveWebhookUrl('TASKMASTER_NEWSLETTER_WEBHOOK_URL', '/api/webhooks/newsletter'),
      secret: process.env.NEWSLETTER_WEBHOOK_SECRET,
      payload: {
        email: email.trim(),
        source: 'tsc-footer',
        sourceSite: 'tsc-website',
        subscribedAt: new Date().toISOString(),
      },
    });

    if (!ok) {
      const err = (body as { error?: string })?.error || `Newsletter sync failed (${status})`;
      throw new Error(err);
    }

    return res.status(200).json({ success: true, message: 'Successfully subscribed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[newsletter] Taskmaster forward failed:', message);
    return res.status(500).json({ success: false, error: message });
  }
}
