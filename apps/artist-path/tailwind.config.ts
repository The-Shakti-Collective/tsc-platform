import type { Config } from 'tailwindcss';

/** Brand tokens with opacity support — values come from CSS variables in globals.css */
const brand = (name: string) => `rgb(var(--brand-${name}-rgb) / <alpha-value>)`;

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
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
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
        'brand-teal-deep': brand('teal-deep'),
        'brand-green': brand('green'),
        'brand-teal-mid': brand('teal-mid'),
        'brand-peacock': brand('peacock'),
        'brand-cream': brand('cream'),
        'brand-cream-muted': brand('cream-muted'),
        'brand-cream-wash': brand('cream-wash'),
        'brand-pumpkin': brand('pumpkin'),
        'brand-pumpkin-soft': brand('pumpkin-soft'),
        'brand-green-soft': brand('green-soft'),
        'brand-espresso': brand('espresso'),
        'brand-burgundy': brand('burgundy'),
        'brand-rust': brand('rust'),
        'brand-red-oxide': brand('red-oxide'),
        'brand-mustard': brand('mustard'),
        'brand-peacock-soft': brand('peacock-soft'),
        'brand-red-oxide-soft': brand('red-oxide-soft'),
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
