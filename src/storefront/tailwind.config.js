/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        charcoal: '#1f1f1f',
        alabaster: '#f7f7f7',
        champagne: '#f4f0e6',
        gold: {
          100: '#f6e9d6',
          200: '#ead2ac',
          300: '#deb983',
          400: '#cfa45f',
          500: '#b98b3b',
          600: '#95702f',
          700: '#705323',
        },
      },
      boxShadow: {
        soft: '0 25px 45px rgba(17, 24, 28, 0.08)',
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

