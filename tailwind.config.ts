import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cs: {
          bg: '#05060A',
          surface: '#0E1016',
          border: 'rgba(255,255,255,.08)',
          'border-strong': 'rgba(255,255,255,.14)',
          accent: '#35D07F',
          'accent-dim': 'rgba(53,208,127,0.12)',
          danger: '#E8465F',
          'danger-dim': 'rgba(232,70,95,0.12)',
          gold: '#F5C542',
          silver: '#C7CDD6',
          bronze: '#C9884E',
          text1: '#EAF0E8',
          text2: 'rgba(234,240,232,.55)',
          text3: 'rgba(234,240,232,.4)',
        },
      },
      fontFamily: {
        display: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      animation: {
        'cs-pulse': 'cs-pulse 1.6s ease-out infinite',
        'cs-in': 'cs-in 0.3s ease-out both',
        'cs-pop': 'cs-pop 0.28s ease-out',
        'cs-danger-pulse': 'cs-danger-pulse 0.7s ease-in-out infinite',
        'cs-float-up': 'cs-float-up 0.5s ease-out both',
        'cs-burst': 'cs-burst 0.6s ease-out both',
      },
      keyframes: {
        'cs-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(53,208,127,0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(53,208,127,0)' },
        },
        'cs-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'cs-pop': {
          '0%': { transform: 'scale(1.5)', opacity: '0.5' },
          '60%': { transform: 'scale(0.94)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'cs-danger-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'cs-float-up': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.9)' },
          '30%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-18px) scale(1.05)' },
        },
        'cs-burst': {
          '0%': { transform: 'scale(0.4)', opacity: '0.9' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
