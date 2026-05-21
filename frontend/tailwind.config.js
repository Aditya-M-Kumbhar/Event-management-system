/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c0cfff',
          300: '#93abff',
          400: '#5e7bff',
          500: '#3a52ff',
          600: '#2030f5',
          700: '#1a22df',
          800: '#1c22b5',
          900: '#1c228e',
          950: '#12144f',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fc',
          tertiary:  '#f0f2f8',
          dark:      '#0d0f1a',
          'dark-secondary': '#141627',
          'dark-tertiary':  '#1c1f35',
        },
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'monospace'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':      'fadeIn .3s ease-in-out',
        'slide-up':     'slideUp .4s ease-out',
        'slide-down':   'slideDown .3s ease-out',
        'scale-in':     'scaleIn .2s ease-out',
        'shimmer':      'shimmer 1.5s infinite',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-soft':  'bounceSoft .6s ease infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                       to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        bounceSoft: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.08)',
        'card-hover':'0 4px 16px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06)',
        'modal':     '0 20px 60px rgba(0,0,0,.18)',
        'glow':      '0 0 20px rgba(58,82,255,.35)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
