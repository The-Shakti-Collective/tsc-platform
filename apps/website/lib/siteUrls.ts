/** Public program landing (Vercel: theartistpath.in) */
export const ARTIST_PATH_LANDING_URL =
  (process.env.NEXT_PUBLIC_ARTIST_PATH_URL || 'https://theartistpath.in').replace(/\/$/, '');

/** Application wizard on the main TSC site */
export const ARTIST_PATH_FORM_PATH = '/artist-path';

/** Artist booking inquiry form (no /artist landing page) */
export const ARTIST_BOOKING_FORM_PATH = '/query';

export const ARTIST_PATH_FORM_URL = `${
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://theshakticollective.in').replace(/\/$/, '')
}${ARTIST_PATH_FORM_PATH}`;
