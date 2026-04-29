import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0E0E12',
          elev1: '#17171F',
          elev2: '#1F1F2A',
        },
        text: {
          primary: '#F0E6D2',
          secondary: '#A8A8B3',
          tertiary: '#6B6B75',
        },
        gold: {
          DEFAULT: '#C9A44C',
          hover: '#D9B95C',
        },
        border: {
          subtle: '#2A2A36',
          strong: '#3A3A46',
        },
        faction: {
          stark: '#6B7B8C',
          lannister: '#9B2226',
          baratheon: '#F0B323',
          greyjoy: '#1C3B47',
          tyrell: '#4B6B3A',
          martell: '#C94E2A',
          tully: '#4B6FA5',
          arryn: '#8AAFC8',
          targaryen: '#5B2D8A',
        },
      },
      fontFamily: {
        brand: ['Cinzel', 'serif'],
        display: ['Spectral', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        panel: '0 24px 80px -28px rgba(0, 0, 0, 0.72)',
      },
      backgroundImage: {
        glow: 'radial-gradient(circle at top, rgba(201, 164, 76, 0.18), transparent 35%), radial-gradient(circle at bottom right, rgba(75, 111, 165, 0.14), transparent 30%)',
      },
    },
  },
  plugins: [],
} satisfies Config
