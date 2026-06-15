import type { NextApiRequest, NextApiResponse } from 'next';
import { buildTaskmasterEnquiryPayload, forwardToTaskmasterEnquiry } from '@/lib/forwardArtistEnquiry';

function sanitizeField(text: unknown): string {
  if (text == null) return '';
  return String(text).trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: 'Empty request body' });
    }

    const sanitized = {
      name: sanitizeField(data.name),
      company: sanitizeField(data.company),
      email: sanitizeField(data.email),
      phone: sanitizeField(data.phone),
      collabType: sanitizeField(data.collabType),
      artist: sanitizeField(data.artist),
      nature: sanitizeField(data.nature),
      locationTime: sanitizeField(data.locationTime),
      scale: sanitizeField(data.scale),
      logisticsSupport: sanitizeField(data.logisticsSupport),
      additionalVision: sanitizeField(data.additionalVision),
    };

    await forwardToTaskmasterEnquiry(buildTaskmasterEnquiryPayload(sanitized));

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[query] forward error:', message);
    return res.status(500).json({ success: false, error: message });
  }
}
