import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchPublicReviews, forwardMasterclassReview } from '@/lib/forwardMasterclassReview';

const REQUIRED_POST_FIELDS = [
  'firstName',
  'lastName',
  'registeredMobile',
  'registeredEmail',
  'oneLineExperience',
  'improvementSuggestion',
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { ok, status, body } = await fetchPublicReviews('review01');
      if (!ok) {
        return res.status(status).json(body);
      }
      return res.status(200).json(body);
    }

    if (req.method === 'POST') {
      const data = req.body as Record<string, unknown>;
      const missing = REQUIRED_POST_FIELDS.filter((field) => !data[field]);
      if (missing.length) {
        return res.status(400).json({ error: 'Missing required fields', required: [...REQUIRED_POST_FIELDS] });
      }

      const { ok, status, body } = await forwardMasterclassReview(data, 'review01');
      if (!ok) {
        const err = (body as { error?: string })?.error || `Review sync failed (${status})`;
        return res.status(status >= 400 ? status : 500).json({ error: err });
      }

      return res.status(200).json({ success: true, message: 'Successfully submitted review.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    console.error('[reviews] error:', message);
    return res.status(500).json({ error: 'Failed to process request', details: message });
  }
}
