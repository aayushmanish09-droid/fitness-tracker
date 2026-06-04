import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  // absolute paths so content scanning works regardless of cwd
  content: [join(here, 'index.html'), join(here, 'src/**/*.{js,jsx}')],
  theme: {
    extend: {
      colors: {
        // Surfaces — layered near-black
        ink: {
          900: '#08090B', // app background
          800: '#0E1013', // surface
          700: '#151A1F', // card
          600: '#1C232A', // elevated / hover
          500: '#242C34', // border-ish
        },
        // Lime / chartreuse accent (screenshot inspiration)
        lime: {
          DEFAULT: '#C7F716',
          50: '#F7FFCC',
          100: '#ECFF99',
          200: '#E0FF66',
          300: '#D6FA3D',
          400: '#C7F716',
          500: '#AEDA00',
          600: '#8DB200',
        },
        // Text
        chalk: '#F4F6F5',
        mist: '#A7B0B6',
        ash: '#6B757C',
        // Workout type colors (per spec)
        push: '#3B82F6', // blue
        pull: '#F0454B', // red
        legs: '#22C55E', // green
        upper: '#A855F7', // purple
        lower: '#FB923C', // orange
        rest: '#4B5563', // dark gray
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(199,247,22,0.25), 0 8px 30px -8px rgba(199,247,22,0.35)',
        card: '0 10px 40px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
