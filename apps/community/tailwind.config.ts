import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
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
        brand: {
          'teal-deep': 'var(--brand-teal-deep)',
          green: 'var(--brand-green)',
          'teal-mid': 'var(--brand-teal-mid)',
          cream: 'var(--brand-cream)',
          'cream-muted': 'var(--brand-cream-muted)',
          'cream-wash': 'var(--brand-cream-wash)',
          pumpkin: 'var(--brand-pumpkin)',
          espresso: 'var(--brand-espresso)',
          burgundy: 'var(--brand-burgundy)',
          rust: 'var(--brand-rust)',
          amber: 'var(--brand-amber)',
          charcoal: 'var(--brand-charcoal)',
          'green-soft': 'var(--brand-green-soft)',
          'pumpkin-soft': 'var(--brand-pumpkin-soft)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
