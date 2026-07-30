import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Outfit — titles, numbers, CTA. In React Native each weight is a
        // distinct loaded family, so we expose it explicitly.
        display: ["Outfit_800ExtraBold"],
        // Atkinson Hyperlegible — body and UI, tuned for legibility at all ages.
        body: ["AtkinsonHyperlegible_400Regular"],
        "body-700": ["AtkinsonHyperlegible_700Bold"],
      },
      colors: {
        pour: "#10b981",
        contre: "#ef4444",
        abstention: "#94a3b8",
        compass: {
          bg: "#f8fafc",
          axis: "#e2e8f0",
          user: "#6366f1",
        },
        // Design-system neutrals (boussole redesign)
        ink: "#1f2430",
        surface: "#f6f7fb",
        line: "#e8eaf0",
        // Concordance semantics: colour is always paired with a text label.
        concordance: {
          proche: "#0e9f6e",
          "proche-bg": "#e7f7f0",
          moyen: "#d97706",
          "moyen-bg": "#fcf2e2",
          eloigne: "#e5484d",
          "eloigne-bg": "#fdecec",
        },
      },
    },
  },
} satisfies Config;
