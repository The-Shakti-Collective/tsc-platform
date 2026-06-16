/**
 * TSC Design Language v1.0 — canonical tokens for layout-helpers.mjs and page generators.
 * @see docs/design-language-v1.md
 */

export const COLORS = {
  cream: '#FFECD1',
  creamLight: '#FFF5E8',
  tealDark: '#083D3A',
  tealMid: '#126D5E',
  orange: '#FF8C00',
  amberText: '#AD6517',
  white: '#FFFFFF',
};

/** Standard editorial section padding */
export const SECTION_PAD = 'py-24 md:py-32 px-4 sm:px-6';

/** Compact padding for utility bands (stats bars, etc.) */
export const SECTION_PAD_COMPACT = 'py-16 px-4 sm:px-6';

/** Hero clears fixed header */
export const HERO_PAD = 'pt-28 pb-12 md:pb-16';

/** Booking / conversion band */
export const CONVERSION_PAD = 'py-24 md:py-32 px-4';

/** Content width tokens */
export const WIDTH = {
  narrative: 'max-w-3xl',
  editorial: 'max-w-5xl',
  grid: 'max-w-7xl',
};

/** Tailwind bg class → wave SVG fill hex (NEXT section background) */
export const BG_FILL = {
  'bg-cream': COLORS.cream,
  'bg-cream-light': COLORS.creamLight,
  'bg-teal-dark': COLORS.tealDark,
  'bg-white': COLORS.white,
};

export const EYEBROW =
  'text-[10px] font-black uppercase tracking-[0.35em] text-orange font-alan-sans';

export const EYEBROW_CONNECT =
  'text-xs font-black uppercase tracking-[0.25em] text-amber-text font-alan-sans';

export const H1 =
  'text-[clamp(2.5rem,6vw,4rem)] font-signika font-bold text-teal-dark leading-tight';

export const H2 =
  'text-[clamp(2rem,4vw,3rem)] font-signika font-bold text-teal-dark';

export const H2_SECTION = 'font-signika font-bold text-2xl md:text-3xl text-teal-dark';

export const BODY = 'text-lg text-amber-text font-alan-sans leading-relaxed';

export const BODY_SM = 'text-base text-amber-text font-alan-sans leading-relaxed';

export const PRIMARY_CTA =
  'inline-flex px-8 py-3 rounded-full bg-orange text-white font-bold font-alan-sans hover:bg-orange/90 transition-colors';

export const SECONDARY_CTA =
  'inline-flex px-6 py-3 rounded-full border border-teal-dark/20 text-teal-dark font-bold font-alan-sans hover:border-orange hover:text-orange transition-colors';

export const TERTIARY_LINK =
  'text-orange font-semibold font-alan-sans hover:underline transition-colors';

export const OUTLINE_PILL =
  'inline-flex px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-teal-dark/20 text-teal-dark font-alan-sans text-sm hover:border-orange hover:text-orange transition-colors';

export const CARD =
  'rounded-2xl border border-teal-dark/10 bg-white hover:border-orange/30 transition-colors';
