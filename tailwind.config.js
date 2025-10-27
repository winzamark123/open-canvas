/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  darkMode: ["class"],
  content: [
    "./excalidraw-app/**/*.{ts,tsx}",
    "./packages/excalidraw/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "slide-up-bounce": {
          "0%": {
            transform: "translate(-50%, 100%)",
            opacity: "0",
          },
          "50%": {
            transform: "translate(-50%, -55%)",
          },
          "65%": {
            transform: "translate(-50%, -48%)",
          },
          "80%": {
            transform: "translate(-50%, -52%)",
          },
          "95%": {
            transform: "translate(-50%, -49%)",
          },
          "100%": {
            transform: "translate(-50%, -50%)",
            opacity: "1",
          },
        },
        "slide-down": {
          "0%": {
            transform: "translate(-50%, -50%)",
            opacity: "1",
          },
          "100%": {
            transform: "translate(-50%, 100%)",
            opacity: "0",
          },
        },
      },
      animation: {
        "slide-up-bounce": "slide-up-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-down": "slide-down 0.3s ease-in",
      },
    },
  },
  plugins: [],
};
