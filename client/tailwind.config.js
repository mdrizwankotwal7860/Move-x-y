/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#2dd4bf', // teal-400
          DEFAULT: '#14b8a6', // teal-500
          dark: '#0f766e', // teal-700
        }
      }
    },
  },
  plugins: [],
}
