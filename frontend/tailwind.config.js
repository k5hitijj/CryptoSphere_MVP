/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#adc2ff',
          400: '#7599ff',
          500: '#3b66ff', // primary blue
          600: '#2544eb',
          700: '#1c31d6',
          800: '#1727ad',
          900: '#18248a',
        },
        dark: {
          bg: '#0B0F19',       // Deep midnight blue
          card: '#161F30',     // Dark slate card
          border: '#243249',   // Glass stroke
          muted: '#8A99AD',    // Cool gray text
        },
        crypto: {
          green: '#10B981',    // Emerald green
          red: '#EF4444',      // Red
          amber: '#F59E0B',    // Gold
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(59, 102, 255, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
