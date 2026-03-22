import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pour: "#10b981",
        contre: "#ef4444",
        abstention: "#94a3b8",
        compass: {
          bg: "#f8fafc",
          axis: "#e2e8f0",
          user: "#6366f1",
        },
      },
    },
  },
} satisfies Config;
