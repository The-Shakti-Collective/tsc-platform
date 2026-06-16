import type { VercelRequest, VercelResponse } from '@vercel/node';

function platformBase(): string {
  const raw = (process.env.TSC_API_URL || process.env.PLATFORM_API_URL || 'http://127.0.0.1:4000').trim();
  return raw.replace(/\/$/, '');
}

function platformSecret(): string {
  return (process.env.WEBSITE_PUBLIC_API_SECRET || '').trim();
}

export async function proxyToPlatform(
  path: string,
  body: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const secret = platformSecret();
  if (!secret) {
    return { status: 503, json: { success: false, error: 'WEBSITE_PUBLIC_API_SECRET not configured' } };
  }

  const res = await fetch(`${platformBase()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Website-Public-Secret': secret,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

export function apiHandler(path: string) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      const { status, json } = await proxyToPlatform(path, req.body ?? {});
      return res.status(status >= 400 ? status : 200).json(json);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: message });
    }
  };
}
