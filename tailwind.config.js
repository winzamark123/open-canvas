/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './excalidraw-app/**/*.{ts,tsx}',
    './packages/excalidraw/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

