/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        jago: {
          blue: '#1D4EDB',
          gold: '#F59E0B',
          ink: '#172033',
          surface: '#F6F7FB',
        },
      },
    },
  },
  plugins: [],
};
