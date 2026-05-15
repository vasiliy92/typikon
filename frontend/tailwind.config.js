/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        slavonic: ['Ponomar Unicode', 'Monomakh', 'serif'],
      },
      colors: {
        liturgy: {
          gold: '#c9a84c',
          burgundy: '#7a1b2d',
          navy: '#1a1f3a',
          cream: '#f5f0e8',
          parchment: '#f8f4ec',
          incense: '#8b7355',
          icon: '#2d4a3e',
          cross: '#b8860b',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, oklch(0.13 0.028 261.692) 0%, oklch(0.18 0.035 280) 100%)',
        'gradient-light': 'linear-gradient(135deg, #f5f0e8 0%, #ede6d6 100%)',
      },
    },
  },
  plugins: [],
};
