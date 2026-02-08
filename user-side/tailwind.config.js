/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#77b5fe", // New Brand Blue
        secondary: "#333333",
        accent: "#FFC107",
        paper: "#fcfcfd", // Custom Background
      },
    },
  },
  plugins: [],
};
