/**
 * Utility function to merge classnames safely
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Convert pixels to rem
 */
export const pxToRem = (px: number): string => `${px / 16}rem`;

/**
 * Delay helper for animations (in milliseconds)
 */
export const delayMs = (ms: number) => `${ms}ms`;

/**
 * Create smooth color transition
 */
export const colorTransition = (duration: number = 300) => ({
  transition: `color ${duration}ms ease-in-out`,
});

/**
 * Accessibility: Skip to main content link styles
 */
export const skipLinkStyles = {
  position: 'absolute' as const,
  top: '-40px',
  left: '0',
  background: '#000',
  color: 'white',
  padding: '8px',
  textDecoration: 'none',
  zIndex: 100,
  '&:focus': {
    top: '0',
  },
};
