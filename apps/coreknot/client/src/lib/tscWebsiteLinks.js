/**
 * Public TSC website URLs surfaced inside CoreKnot (CRM, dashboards).
 * Override with VITE_TSC_WEBSITE_URL in client .env (e.g. http://localhost:3002 for local website dev).
 */

const DEFAULT_TSC_WEBSITE = 'https://theshakticollective.in';

export function getTscWebsiteBaseUrl() {
  const raw = import.meta.env.VITE_TSC_WEBSITE_URL || DEFAULT_TSC_WEBSITE;
  return String(raw).replace(/\/+$/, '');
}

export function getBookACallUrl() {
  return `${getTscWebsiteBaseUrl()}/book-a-call`;
}

export function getArtistPathUrl() {
  return `${getTscWebsiteBaseUrl()}/artist-path`;
}
