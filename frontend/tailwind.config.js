/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#F7F5F0',
          surface: '#FFFFFF',
          border: '#E4E0D6',
        },
        ink: {
          900: '#1C1B22',
          700: '#2F2E36',
          600: '#4A4852',
          400: '#7E7C88',
        },
        accent: {
          primary: '#0F5C42',
          hover: '#0B4733',
          tint: '#EDF5F2',
          gold: '#9A7B2F',
          goldTint: '#FAF6ED',
        },
        risk: {
          critical: '#A32B2B',
          criticalTint: '#F9ECEC',
          moderate: '#B8752B',
          moderateTint: '#FAF3EB',
          low: '#3D7A52',
          lowTint: '#EEF6F1',
        },
      },
      fontFamily: {
        serif: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],

        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],

        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
      },
    },
  },
  plugins: [],
}
