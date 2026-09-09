import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#eef7ea',
          100: '#d7ecc9',
          200: '#b3dc98',
          300: '#8bc866',
          400: '#5f9a3e',
          500: '#2B9611',
          600: '#23800d',
          700: '#1c650b',
          800: '#123d09',
          900: '#0c2b08',
          950: '#081f05',
        },
        gold: {
          50: '#fbf7ee',
          100: '#f3e8ce',
          200: '#e9d5a8',
          300: '#ddbf80',
          400: '#d1a95a',
          500: '#c39642',
          600: '#a67c33',
          700: '#84612a',
          800: '#5f4620',
          900: '#3d2d15',
        },
        ink: '#0f1f0d',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out forwards',
        blink: 'blink 1s step-start infinite',
      },
    },
  },
  plugins: [],
};

export default config;
