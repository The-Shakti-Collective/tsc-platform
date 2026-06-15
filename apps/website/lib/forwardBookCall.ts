import { forwardToTaskmaster, resolveWebhookUrl } from './taskmasterWebhook';

export function resolveBookCallWebhookUrl(): string {
  const explicit = (
    process.env.TASKMASTER_WEBHOOK_URL ||
    process.env.CRM_WEBHOOK_URL ||
    process.env.COREKNOT_BOOK_CALL_WEBHOOK_URL ||
    ''
  ).trim();
  if (explicit) return explicit;
  return resolveWebhookUrl('TASKMASTER_WEBHOOK_URL', '/api/webhooks/book-call');
}

export async function forwardBookCallToTaskmaster(
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const secret = process.env.BOOK_CALL_WEBHOOK_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('BOOK_CALL_WEBHOOK_SECRET is required in production');
  }

  return forwardToTaskmaster({
    url: resolveBookCallWebhookUrl(),
    secret,
    payload: { ...payload, source: 'tsc-website', sourceSite: 'tsc-website' },
    useHmac: false,
  });
}
