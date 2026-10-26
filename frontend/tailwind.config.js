/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080d1a',
          surface: '#0f172a',
          card: '#131e36',
          border: '#1e293b',
          accent: '#06b6d4',
          accentGlow: 'rgba(6, 182, 212, 0.15)',
          danger: '#ef4444',
          warning: '#f59e0b',
          safe: '#10b981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
