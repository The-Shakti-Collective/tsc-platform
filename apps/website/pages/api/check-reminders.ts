import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    success: false,
    error: 'Deprecated — book-call reminders are handled by Taskmaster CRM.',
  });
}
