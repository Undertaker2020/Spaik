/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        spaik: {
          bg:           '#1A1D27',
          nav:          '#12141E',
          card:         '#2A2D3A',
          outer:        '#0F1117',
          accent:       '#18B9AE',
          'accent-dark': '#0E8F86',
          border:       '#2A2D3A',
          secondary:    '#9CA3AF',
          muted:        '#6B7280',
          subtle:       '#4B5563',
          danger:       '#E53E3E',
        },
      },
    },
  },
  plugins: [],
};
