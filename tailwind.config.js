/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          650: '#3e4a5b',
          850: '#151d30',
        },
        indigo: {
          650: '#4338ca', // custom premium indigo
        },
        violet: {
          650: '#6d28d9', // custom premium violet
        },
        kalki: {
          bg: '#12181B',
          panel: '#1B2328',
          border: '#2A3438',
          textPrimary: '#E8ECED',
          textMuted: '#7C8A8F',
          vacant: '#10B981',
          occupied: '#EF4444',
          reserved: '#F59E0B',
          live: '#10B981',
          alert: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
