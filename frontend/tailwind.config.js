/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#D52B1E',
        gold: '#D4AF37',
        'gold-light': '#F2D060',
        'gold-dark': '#9A7B1A',
        ink: '#040308',
        ink2: '#0F0D10',
        ink3: '#181520',
        green: '#00E87A',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
