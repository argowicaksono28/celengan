import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        // Dark mode backgrounds
        "bg-primary": "#0F172A",
        "bg-secondary": "#1E293B",
        "bg-tertiary": "#334155",
        // Semantic colors
        income: "#10B981",
        expense: "#EF4444",
        warning: "#F59E0B",
        accent: "#3B82F6",
        savings: "#8B5CF6",
        transfer: "#06B6D4",
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        badge: "6px",
      },
      keyframes: {
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "progress-fill": {
          from: { width: "0%" },
          to: { width: "var(--progress-width)" },
        },
        "pulse-red": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "count-up": "count-up 0.5s ease-out forwards",
        "pulse-red": "pulse-red 1.5s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
