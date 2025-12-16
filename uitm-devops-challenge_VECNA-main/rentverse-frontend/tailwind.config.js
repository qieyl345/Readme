/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Teal color scheme
        'teal': {
          50: '#F1FCF8',
          100: '#D1F6EB',
          200: '#A3ECD9',
          300: '#6EDAC1',
          400: '#40C1A8',
          500: '#26A68F',
          600: '#1C8574',
          700: '#1A6B5E',
          800: '#1A554E',
          900: '#1A4741',
          950: '#0B3531',
        },
        // Orange color scheme
        'orange': {
          50: '#FFF4ED',
          100: '#FFE6D5',
          200: '#FEC9AA',
          300: '#FEA273',
          400: '#FC713B',
          500: '#FA4F19',
          600: '#EB320B',
          700: '#C3220B',
          800: '#9B1D11',
          900: '#7C1B12',
          950: '#430A07',
        },
        // Slate color scheme
        'slate': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CAD5E2',
          400: '#90A1B9',
          500: '#62748E',
          600: '#45556C',
          700: '#314158',
          800: '#1D293D',
          900: '#0F172B',
          950: '#020618',
        },
      },
      fontFamily: {
        serif: ['Poly', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}