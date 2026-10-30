/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zack: {
          grid: '#1d4ed8',
          bg: '#060d1f',
          panel: '#0d1526',
          border: '#1e293b',
          accent: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
