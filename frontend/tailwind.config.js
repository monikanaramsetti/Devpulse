/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d1117",
        card: "#161b22",
        border: "#30363d",
        muted: "#8b949e",
        foreground: "#c9d1d9",
        heading: "#f0f6fc",
        accent: {
          lime: "#2ea043",
          green: "#3fb950",
          amber: "#d29922",
          coral: "#f85149",
          blue: "#58a6ff"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
