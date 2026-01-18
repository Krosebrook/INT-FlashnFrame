/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          950: 'rgb(var(--c-bg-950) / <alpha-value>)',
          900: 'rgb(var(--c-bg-900) / <alpha-value>)',
          800: 'rgb(var(--c-bg-800) / <alpha-value>)',
          700: 'rgb(var(--c-text-700) / <alpha-value>)',
          600: 'rgb(var(--c-text-600) / <alpha-value>)',
          500: 'rgb(var(--c-text-500) / <alpha-value>)',
          400: 'rgb(var(--c-text-400) / <alpha-value>)',
          300: 'rgb(var(--c-text-300) / <alpha-value>)',
          200: 'rgb(var(--c-text-200) / <alpha-value>)',
          100: 'rgb(var(--c-text-100) / <alpha-value>)',
        },
        white: 'rgb(var(--c-white) / <alpha-value>)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
        'liquid-dark': 'radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.5) 0%, rgba(2, 6, 23, 1) 80%)',
      },
      boxShadow: {
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-sm': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        'neon-violet': '0 0 20px -5px rgba(139, 92, 246, 0.5)',
        'neon-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.5)',
        'neon-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.5)',
      }
    }
  },
  plugins: [],
}
