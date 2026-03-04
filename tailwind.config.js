/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
          50: "#EAF7FF",
          100: "#D1ECFF",
          200: "#A6DBFF",
          300: "#69BDFA",
          400: "#25A1EC",
          500: "#0084D1",
          600: "#006FB9",
          700: "#005A9B",
          800: "#004478",
          900: "#00315B",
          950: "#001C3C",
        },
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        surface: {
          DEFAULT: "var(--color-surface)",
          elevated: "var(--color-surface-elevated)",
        },
        "muted-foreground": "var(--color-muted-foreground)",
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        card: {
          rose: "#E8A8B8",
          peach: "#F9BEB0",
          cream: "#FCE7AE",
          teal: "#78C3C9",
          lavender: "#C09BBC",
        },
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
      },
    },
  },
  plugins: [],
};
