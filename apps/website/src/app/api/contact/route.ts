import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { captureServerEvent, isPosthogConfigured } from '@/lib/analytics/posthog-server';

export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  interest: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(10).max(4000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, interest, message } = parsed.data;
  const distinctId = createHash('sha256').update(email.toLowerCase()).digest('hex');

  const tracked = await captureServerEvent(
    'website_contact_submitted',
    { name, email, interest, message_length: message.length },
    distinctId,
  );

  if (!isPosthogConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Contact pipeline unavailable',
        detail: 'Configure NEXT_PUBLIC_POSTHOG_KEY to enable contact submissions.',
      },
      { status: 503 },
    );
  }

  if (!tracked) {
    return NextResponse.json({ ok: false, error: 'Analytics capture failed' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
