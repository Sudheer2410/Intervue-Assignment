/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F0DCE",
        violet: "#7765DA",
        accent: "#5767D0",
        background: "#F2F2F2",
        text: "#373737",
        muted: "#6E6E6E",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 