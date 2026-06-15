import { getAppUrl } from '@/lib/app-urls';

/**
 * Absolute logo URL for metadata and Image.
 * Required when Community is proxied at theshakticollective.in/community —
 * root-relative /brand/... 404s on the apex domain.
 */
export const BRAND_LOGO_URL = `${getAppUrl()}/brand/tsc-logo.svg`;
