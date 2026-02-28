/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          950: '#0a1628',
          900: '#0d1f3c',
          800: '#122448',
          700: '#1a3260',
          600: '#234080',
          500: '#2e52a3',
          400: '#4a72c4',
          300: '#7096d8',
          200: '#a3bde8',
          100: '#d1dff4',
          50: '#edf2fb',
        },
        amber: {
          950: '#431407',
          900: '#7c2d12',
          800: '#9a3412',
          700: '#c2410c',
          600: '#ea580c',
          500: '#f97316',
          400: '#fb923c',
          300: '#fdba74',
          200: '#fed7aa',
          100: '#ffedd5',
          50: '#fff7ed',
        },
        slate: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'cockpit-gradient': 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 40%, #122448 70%, #1a3260 100%)',
        'amber-glow': 'radial-gradient(ellipse at top, rgba(251,146,60,0.15) 0%, transparent 60%)',
        'sky-shimmer': 'linear-gradient(180deg, rgba(74,114,196,0.1) 0%, transparent 50%)',
        'card-surface': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'instrument': '0 0 0 1px rgba(251,146,60,0.2), 0 4px 20px rgba(0,0,0,0.4)',
        'panel': '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.5)',
        'amber-glow': '0 0 20px rgba(251,146,60,0.3)',
        'sky-glow': '0 0 20px rgba(74,114,196,0.3)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scan-line': 'scanLine 4s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(251,146,60,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(251,146,60,0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
