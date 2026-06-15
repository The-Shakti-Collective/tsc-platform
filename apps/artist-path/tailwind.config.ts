import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Flat keys — match class names used in components (gradients, opacity, etc.) */
        'brand-teal-deep': '#083d3a',
        'brand-green': '#126d5e',
        'brand-teal-mid': '#08525f',
        'brand-cream': '#ffecd1',
        'brand-cream-muted': '#f4eee3',
        'brand-cream-wash': '#fcf8f2',
        'brand-pumpkin': '#b74b02',
        'brand-pumpkin-soft': '#fef7e0',
        'brand-green-soft': '#e6f4f1',
        'brand-espresso': '#592314',
        'brand-burgundy': '#6d2034',
        'brand-rust': '#88281c',
        'brand-mustard': '#ad6517',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
