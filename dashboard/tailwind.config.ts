import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eve: {
          bg: "#0a0a0f",
          surface: "#12121a",
          elevated: "#1a1a25",
          border: "#2a2a3a",
          orange: "#c64f05",
          "orange-light": "#e8751a",
          "orange-dim": "#7a3200",
          green: "#22c55e",
          red: "#ef4444",
          blue: "#3b82f6",
          muted: "#6b7280",
          text: "#e5e7eb",
          "text-dim": "#9ca3af",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
