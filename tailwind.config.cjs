/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./dist/**/*.html', './src/**/*.{js,mjs}', './functions/**/*.js'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#1F3A2E', 700: '#2A4A3B', 900: '#152A20' },
        terra:  { DEFAULT: '#B5634B', light: '#D08B73', soft: '#F3E3DA' },
        sage:   { DEFAULT: '#9DA98E', light: '#DCE2D4' },
        cream:  { DEFAULT: '#FAF6F1', dark: '#F2EAE1' },
        ink: '#2E3330'
      },
      fontFamily: {
        serif:  ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:   ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        script: ['Allura', 'cursive']
      },
      boxShadow: { soft: '0 10px 40px -12px rgba(31,58,46,.15)' }
    }
  },
  plugins: []
};
