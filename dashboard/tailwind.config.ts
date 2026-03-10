import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eve: {
          bg: "#08080d",
          surface: "#101018",
          elevated: "#181824",
          border: "#232336",
          orange: "#d4600a",
          "orange-light": "#f07a22",
          "orange-dim": "#7a3200",
          green: "#34d399",
          red: "#f87171",
          blue: "#60a5fa",
          yellow: "#fbbf24",
          muted: "#64748b",
          text: "#f1f5f9",
          "text-dim": "#94a3b8",
          "text-faint": "#475569",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
