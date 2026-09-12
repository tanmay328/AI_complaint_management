/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        paper: "#F6F7F5",
        ink: "#16211C",
        accent: {
          DEFAULT: "#2F6F52",
          dark: "#24543F",
          soft: "#E7F0EA",
        },
        clay: {
          DEFAULT: "#9A4B12",
          soft: "#FBEEE2",
        },
        line: "#D9DED9",
        muted: "#5B685F",
      },
    },
  },
  plugins: [],
}
