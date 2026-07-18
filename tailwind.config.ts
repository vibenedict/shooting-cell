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
      },
    },
  },
  plugins: [],
}

export default config
