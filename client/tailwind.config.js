/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(15, 23, 42, 0.7)',
        'glass-strong': 'rgba(15, 23, 42, 0.9)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(ellipse at top, #0f172a, #020617)',
      },
    },
  },
  plugins: [],
};
