/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ratGreen: "#b9f046",
        sewerDark: "#0d1413",
      },
    },
  },
  plugins: [],
};
