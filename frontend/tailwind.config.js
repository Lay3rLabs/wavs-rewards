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
        primary: '#00D7FE',        // Vibrant cyan - primary actions
        secondary: '#00FFB2',      // Neon green - success/secondary actions
        background: '#070B14',     // Darker background for more contrast
        card: '#0F1629',           // Slightly lighter card background
        accent: '#EB4899',         // Hot pink accent for highlights
        tertiary: '#9C7CFC',       // Purple for variety
        overlay: 'rgba(0, 215, 254, 0.05)',  // Cyan with low opacity for overlays
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.primary), 0 0 20px rgba(0, 215, 254, 0.2)',
        'neon-green': '0 0 5px theme(colors.secondary), 0 0 20px rgba(0, 255, 178, 0.2)',
        'neon-pink': '0 0 5px theme(colors.accent), 0 0 20px rgba(235, 72, 153, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(0, 215, 254, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 215, 254, 0.1) 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}