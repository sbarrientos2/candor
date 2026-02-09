/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#1A1A1A",
        "surface-raised": "#242424",
        border: "#2A2A2A",
        primary: "#E8A838",
        "primary-light": "#F5C563",
        "text-primary": "#FFFFFF",
        "text-secondary": "#999999",
        "text-tertiary": "#666666",
        success: "#4ADE80",
        error: "#EF4444",
      },
      fontFamily: {
        "display-medium": ["SpaceGrotesk_500Medium"],
        "display-semibold": ["SpaceGrotesk_600SemiBold"],
        "display-bold": ["SpaceGrotesk_700Bold"],
      },
    },
  },
  plugins: [],
};
