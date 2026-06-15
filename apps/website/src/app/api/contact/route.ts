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

function resolvePlatformApiUrl(): string | null {
  const raw =
    process.env.TSC_API_URL?.trim() ??
    process.env.NEXT_PUBLIC_TSC_API_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

async function submitToPlatformInquiry(input: {
  name: string;
  email: string;
  interest: string;
  message: string;
}): Promise<{ ok: true; inquiryId: string } | { ok: false; status: number; detail: string }> {
  const apiBase = resolvePlatformApiUrl();
  const secret = process.env.WEBSITE_CONTACT_SECRET?.trim();
  const orgConfigured = Boolean(process.env.TSC_DEFAULT_ORG_ID?.trim());

  if (!apiBase || !secret || !orgConfigured) {
    return {
      ok: false,
      status: 503,
      detail: 'Platform inquiry pipeline not configured (TSC_API_URL, WEBSITE_CONTACT_SECRET, TSC_DEFAULT_ORG_ID).',
    };
  }

  const response = await fetch(`${apiBase}/public/inquiries/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Website-Contact-Secret': secret,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      status: response.status,
      detail: text || response.statusText,
    };
  }

  const payload = (await response.json()) as { id?: string };
  return { ok: true, inquiryId: payload.id ?? 'unknown' };
}

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

  const inquiry = await submitToPlatformInquiry({ name, email, interest, message });
  if (!inquiry.ok) {
    return NextResponse.json(
      { ok: false, error: 'Inquiry submission failed', detail: inquiry.detail },
      { status: inquiry.status },
    );
  }

  if (isPosthogConfigured()) {
    await captureServerEvent(
      'website_contact_submitted',
      {
        name,
        email,
        interest,
        message_length: message.length,
        inquiry_id: inquiry.inquiryId,
        pipeline: 'platform_api',
      },
      distinctId,
    );
  }

  return NextResponse.json({ ok: true, inquiryId: inquiry.inquiryId });
}
