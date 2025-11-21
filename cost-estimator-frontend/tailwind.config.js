/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your Brand Color: rgb(20, 37, 54) -> Hex #142536
        primary: {
          DEFAULT: '#142536', 
          light: '#2c4259',   // Lighter shade for hover states
          dark: '#0b1621',    // Darker shade for active states
        },
        // Backgrounds
        bg: {
          main: '#f3f4f6',    // Light Gray for dashboard background
          paper: '#ffffff',   // White for cards
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}