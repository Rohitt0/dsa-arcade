import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Default sm:640 md:768 lg:1024 xl:1280 2xl:1536 remain; add a small-phone step.
        xs: '480px',
      },
      colors: {
        night: {
          900: '#0b0c1e',
          800: '#141633',
          700: '#1e2250',
          600: '#2b3070',
        },
        ink: '#15162b',
        parchment: '#f4e9d0',
        stone: {
          300: '#9aa0bf',
          400: '#6b7199',
          500: '#474d73',
        },
        sun: '#f2a65a',
        ember: '#e4572e',
        gold: '#ffcf4e',
        grass: '#5fc26a',
        sky: '#6cb8e4',
        arcane: '#b06cf0',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
        body: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        pixel: '4px 4px 0 0 rgba(0,0,0,0.45)',
        'pixel-sm': '2px 2px 0 0 rgba(0,0,0,0.45)',
        'pixel-lg': '6px 6px 0 0 rgba(0,0,0,0.5)',
        'pixel-inset': 'inset 0 0 0 2px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
