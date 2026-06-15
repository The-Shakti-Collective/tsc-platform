/**
 * UNFOLD Motion Specifications
 * Custom Framer Motion variants and animation presets
 */

export const unfoldAnimations = {
  // Fade up with subtle Y movement
  fadeUp: {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
  },

  // Mask reveal from left to right (clip-path)
  maskReveal: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    whileInView: { clipPath: 'inset(0 0 0 0)' },
    transition: { duration: 1, ease: 'easeInOut' },
    viewport: { once: true, amount: 0.3 },
  },

  // SVG line draw effect
  lineDraw: {
    initial: { strokeDashoffset: 1000 },
    whileInView: { strokeDashoffset: 0 },
    transition: { duration: 2, ease: 'easeInOut' },
    viewport: { once: true, amount: 0.3 },
  },

  // Staggered text reveal per line
  staggerText: {
    initial: { opacity: 0, y: 8 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
  },

  // Container for staggered children
  staggerContainer: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    viewport: { once: true, amount: 0.3 },
  },

  // Subtle parallax effect
  parallax: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8 },
    viewport: { once: true, amount: 0.3 },
  },

  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -24 },
    whileInView: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
  },

  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: 24 },
    whileInView: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
  },

  // Scale up with fade
  scaleUp: {
    initial: { opacity: 0, scale: 0.95 },
    whileInView: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
  },

  // Rotation effect
  rotate: {
    initial: { opacity: 0, rotate: -5 },
    whileInView: { opacity: 1, rotate: 0 },
    transition: { duration: 0.7, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
  },
};

/**
 * Hook to respect prefers-reduced-motion
 * Returns reduced versions of animations if user prefers reduced motion
 */
export const useReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation variant based on reduced motion preference
 */
export const getAnimationVariant = (fullAnimation: any, reducedAnimation: any) => {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reducedAnimation : fullAnimation;
};

/**
 * Animation variants with reduced motion alternatives
 */
export const createAccessibleAnimation = (
  fullVariant: any,
  reducedVariant: any = { initial: {}, whileInView: {}, transition: { duration: 0 } }
) => {
  return {
    full: fullVariant,
    reduced: reducedVariant,
  };
};

/**
 * Scroll-triggered animation hook wrapper
 */
export const scrollAnimationConfig = {
  once: true, // Only animate once
  amount: 0.3, // Trigger when 30% visible
};
