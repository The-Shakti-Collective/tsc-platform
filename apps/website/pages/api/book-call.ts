import type { NextApiRequest, NextApiResponse } from 'next';
import { forwardBookCallToTaskmaster } from '../../lib/forwardBookCall';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { ok, status, body } = await forwardBookCallToTaskmaster(req.body as Record<string, unknown>);

    if (!ok) {
      const err =
        (body as { error?: string; details?: string })?.error ||
        (body as { details?: string })?.details ||
        `CRM sync failed (${status})`;
      throw new Error(err);
    }

    const payload = body as { message?: string; leadId?: string };
    return res.status(status === 202 ? 200 : status).json({
      success: true,
      message: payload.message || 'Call booked successfully!',
      leadId: payload.leadId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[book-call] Taskmaster forward failed:', message);
    return res.status(500).json({ success: false, error: message });
  }
}
