/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Brand Font Families
      fontFamily: {
        signika: ['Signika', 'sans-serif'],
        'alan-sans': ['Alata', 'sans-serif'],
      },

      // Brand Color Palette
      colors: {
        // Primary Canvas (Strictly Black & White)
        white: '#FFFFFF',
        black: '#000000',
        cream: '#FFFFFF', // Mapping cream to white for B&W background
        'cream-light': '#FFFFFF',
        'cream-dark': '#F9F9F9', // Very light gray for subtle contrast

        // Accent Colors
        'academy-blue': {
          light: '#3b82f6',
          DEFAULT: '#1e3a8a',
          dark: '#172554',
        },
        'blue-primary': '#1e3a8a',
        'blue-dark': '#172554',
        'blue-light': '#3b82f6',

        // Highlight Colors
        orange: {
          light: '#FFB347',
          DEFAULT: '#FF8C00',
          dark: '#E67E00',
        },
        pumpkin: '#FF8C00', // Mapping pumpkin to orange
        'pumpkin-dark': '#E67E00',

        // Supporting Colors (Keeping others but they should be used sparingly if at all)
        wine: '#6D2034',
        'sea-foam': '#008080',
        chestnut: '#592314',
        mustard: '#AD6517',
        'red-oxide': '#88281C',
        peacock: '#006666',

        // Neutral Scale (Strictly B&W/Gray)
        charcoal: '#121212',
        'slate-dark': '#2D2D2D',
        'slate-medium': '#505050',
        'slate-light': '#9A9A9A',
        'slate-lighter': '#D4D4D4',
        'slate-lightest': '#F2F2F2',
      },

      // Enhanced Typography Scale
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'sm': ['14px', { lineHeight: '1.625rem', letterSpacing: '0' }],
        'base': ['16px', { lineHeight: '1.75rem', letterSpacing: '0' }],
        'lg': ['18px', { lineHeight: '1.875rem', letterSpacing: '0' }],
        'xl': ['20px', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
        '3xl': ['30px', { lineHeight: '2.625rem', letterSpacing: '-0.02em' }],
        '4xl': ['36px', { lineHeight: '3rem', letterSpacing: '-0.02em' }],
        '5xl': ['42px', { lineHeight: '3.375rem', letterSpacing: '-0.02em' }],
        '6xl': ['48px', { lineHeight: '3.75rem', letterSpacing: '-0.03em' }],
        '7xl': ['56px', { lineHeight: '4.25rem', letterSpacing: '-0.03em' }],
        '8xl': ['64px', { lineHeight: '4.75rem', letterSpacing: '-0.03em' }],
      },

      // Enhanced Spacing Scale
      spacing: {
        '0.5': '0.125rem',
        '1': '0.25rem',
        '1.5': '0.375rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '14': '3.5rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '28': '7rem',
        '32': '8rem',
        '36': '9rem',
        '40': '10rem',
        '48': '12rem',
        '56': '14rem',
        '64': '16rem',
        '80': '20rem',
        '96': '24rem',
      },

      // UNFOLD Animation Presets
      keyframes: {
        // Fade up with subtle movement
        unfoldFadeUp: {
          '0%': { opacity: '0', transform: 'translateY(1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Mask reveal from left to right
        unfoldMaskReveal: {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        // Line draw SVG stroke animation
        unfoldLineDraw: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        // Panel expand for accordion
        unfoldPanelExpand: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '500px', opacity: '1' },
        },
        // Text stagger effect
        unfoldStaggerText: {
          '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Parallax tilt (subtle)
        unfoldTilt: {
          '0%': { transform: 'perspective(1200px) rotateX(0deg)' },
          '100%': { transform: 'perspective(1200px) rotateX(2deg)' },
        },
        // Pulse for interactive elements
        unfoldPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'unfold-fade-up': 'unfoldFadeUp 0.8s ease-out',
        'unfold-mask-reveal': 'unfoldMaskReveal 1s ease-in-out',
        'unfold-line-draw': 'unfoldLineDraw 2s ease-in-out forwards',
        'unfold-panel-expand': 'unfoldPanelExpand 0.6s ease-out',
        'unfold-stagger-text': 'unfoldStaggerText 0.6s ease-out',
        'unfold-tilt': 'unfoldTilt 0.3s ease-out',
        'unfold-pulse': 'unfoldPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // Transition timings
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
      },

      // Border radius
      borderRadius: {
        'none': '0',
        'xs': '0.25rem',
        'sm': '0.375rem',
        'base': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },

      // Box shadows for depth
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'sm': '0 1px 3px 0 rgba(0,0,0,0.1)',
        'base': '0 4px 6px -1px rgba(0,0,0,0.1)',
        'md': '0 10px 15px -3px rgba(0,0,0,0.1)',
        'lg': '0 20px 25px -5px rgba(0,0,0,0.1)',
        'xl': '0 25px 50px -12px rgba(0,0,0,0.15)',
        'academy-blue': '0 10px 30px rgba(30, 58, 138, 0.15)',
      },

      // Screen breakpoints (mobile-first)
      screens: {
        'xs': '320px',
        'sm': '375px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      // Max width for containers
      maxWidth: {
        'container': '1280px',
        'narrow': '512px',
        'prose': '720px',
      },
    },
  },
  plugins: [],
}
