/** @type {import('tailwindcss').Config} */
const primary = {
  50: '#eff4fb',
  100: '#dce7f5',
  200: '#bcd0ea',
  300: '#92b0d9',
  400: '#5f88c2',
  500: '#4673b0',
  600: '#315E9E',
  700: '#294e84',
  800: '#233f69',
  900: '#172B4D',
  950: '#0f1c33',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: '#172B4D',
        primary,
        // Existing pages use indigo-*; remap to the ParcelTrack blue so they pick up the new identity.
        indigo: primary,
        brand: primary,
        teal: {
          50: '#ecf8f4',
          100: '#d0efe6',
          200: '#a2dfcc',
          300: '#6cc8ad',
          400: '#38aa8b',
          500: '#1f9a7b',
          600: '#16856B',
          700: '#126b57',
          800: '#115446',
          900: '#0f4439',
        },
        amber: {
          50: '#fdf8ec',
          100: '#faeccb',
          200: '#f4d898',
          300: '#ecc066',
          400: '#e3aa46',
          500: '#D99A32',
          600: '#bd7b22',
          700: '#9a5e1d',
          800: '#7e4b1e',
          900: '#693f1d',
        },
        surface: '#F5F7FB',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,43,77,0.05), 0 4px 16px rgba(23,43,77,0.06)',
        lift: '0 2px 4px rgba(23,43,77,0.06), 0 12px 32px rgba(23,43,77,0.12)',
      },
    },
  },
  plugins: [],
};
