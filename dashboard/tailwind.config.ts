import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eve: {
          bg: "#000000",
          surface: "#0a0a0a",
          elevated: "#111111",
          border: "#1a1a1a",
          orange: "#e8622b",
          "orange-light": "#ff8340",
          "orange-dim": "#7a3200",
          green: "#22c55e",
          red: "#ef4444",
          blue: "#3b82f6",
          yellow: "#eab308",
          muted: "#525252",
          text: "#f5f5f5",
          "text-dim": "#a3a3a3",
          "text-faint": "#525252",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
