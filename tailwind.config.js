/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1E40AF',
        'brand-secondary': '#1D4ED8',
        'brand-accent': '#3B82F6',
        'status-green': '#16A3A4',
        'status-yellow': '#FACC15',
        'status-red': '#DC2626',
        'status-gray': '#6B7280',
      }
    },
  },
  plugins: [],
}
