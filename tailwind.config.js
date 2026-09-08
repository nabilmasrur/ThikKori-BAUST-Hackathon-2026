/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        stone: {
          base: '#F2F1EC',
          raised: '#FAF9F6',
          line: '#DEDCD3',
          deep: '#E6E4DB',
        },
        ink: {
          DEFAULT: '#1C1A17',
          soft: '#5A554C',
          faint: '#8B857A',
        },
        teal: {
          DEFAULT: '#1D4B4A',
          deep: '#143634',
          soft: '#2E6A68',
          wash: '#E4ECEB',
        },
        amber: {
          DEFAULT: '#D98C2B',
          deep: '#B9741C',
          wash: '#FAEEDC',
        },
        sage: {
          DEFAULT: '#3F7A54',
          wash: '#E5EFE7',
        },
        brick: {
          DEFAULT: '#B8452F',
          wash: '#F7E5E1',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        raise: '0 1px 0 0 #DEDCD3, 0 2px 6px -2px rgba(28,26,23,0.10)',
        lift: '0 10px 30px -12px rgba(28,26,23,0.28)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        pop: { '0%': { transform: 'scale(0.86)', opacity: '0' }, '60%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        stroke: { '0%': { strokeDashoffset: '48' }, '100%': { strokeDashoffset: '0' } },
      },
      animation: {
        rise: 'rise .32s cubic-bezier(.2,.7,.3,1) both',
        pop: 'pop .38s cubic-bezier(.2,.8,.3,1) both',
        stroke: 'stroke .5s .18s ease-out both',
      },
    },
  },
  plugins: [],
};
