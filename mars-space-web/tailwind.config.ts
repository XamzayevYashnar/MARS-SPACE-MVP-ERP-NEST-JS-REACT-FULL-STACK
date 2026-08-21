import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Tokens are defined once as `R G B` triples in globals.css (:root / .dark) and
 * exposed here via `rgb(var(--x) / <alpha-value>)` so opacity utilities
 * (e.g. `border-oxide/40`) work. Never write raw hex in a component.
 */
const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', md: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        void: withVar('void'),
        basalt: {
          DEFAULT: withVar('basalt'),
          raised: withVar('basalt-raised'),
        },
        hairline: withVar('hairline'),
        oxide: withVar('oxide'),
        sol: withVar('sol'),
        ice: withVar('ice'),
        dust: withVar('dust'),
        signal: withVar('signal'),
        alert: withVar('alert'),
      },
      fontFamily: {
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        sans: ['Onest', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // mobile → desktop scale from spec §4.3
        eyebrow: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        'display-lg': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h2: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h3: ['1.5rem', { lineHeight: '1.2' }],
      },
      borderRadius: {
        // Instrument-panel shape language: 2px inputs/buttons, 4px cards, 0 dividers.
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '4px',
        lg: '4px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      maxWidth: {
        container: '1280px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        120: '120ms',
        240: '240ms',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'flap-down': {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(-90deg)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 120ms ease-out both',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
