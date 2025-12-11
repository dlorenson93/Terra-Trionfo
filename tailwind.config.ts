import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdfcfb',
          100: '#faf8f5',
          200: '#f5f0e8',
          300: '#ede5d6',
          400: '#e3d7c1',
          500: '#d6c7aa',
        },
        olive: {
          50: '#f7f8f5',
          100: '#eef0e9',
          200: '#d8dece',
          300: '#b5c0a3',
          400: '#8d9d73',
          500: '#6b7d52',
          600: '#556542',
          700: '#445037',
          800: '#38412e',
          900: '#2f3728',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
