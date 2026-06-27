import type { Config } from "tailwindcss";

/**
 * LearnQuest design system.
 * A bright, playful, high-energy palette — think Duolingo's friendliness,
 * Roblox's vibrancy, and Pokémon's sense of collectible delight.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50: "#eef9ff",
          100: "#d9f0ff",
          200: "#bce6ff",
          300: "#8ed7ff",
          400: "#59bfff",
          500: "#33a1ff",
          600: "#1b80f5",
          700: "#1467e1",
          800: "#1753b6",
          900: "#19488f",
        },
        // Gamification accents
        xp: "#22c55e",
        coin: "#fbbf24",
        streak: "#fb7185",
        gem: "#a855f7",
        // Subject colours (used across cards, worlds, badges)
        subject: {
          english: "#f97316",
          maths: "#3b82f6",
          science: "#10b981",
          social: "#a855f7",
          tech: "#ec4899",
          reo: "#ef4444",
        },
        // Surface tokens (kept semantic so dark mode is a config flip later)
        ink: "#0f172a",
        cloud: "#f8fafc",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        pop: "0 6px 0 0 rgba(0,0,0,0.12)",
        "pop-sm": "0 4px 0 0 rgba(0,0,0,0.12)",
        glow: "0 0 24px 0 rgba(51,161,255,0.45)",
        card: "0 10px 30px -10px rgba(15,23,42,0.25)",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "coin-spin": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
      },
      animation: {
        "float-slow": "float-slow 4s ease-in-out infinite",
        "pop-in": "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        wiggle: "wiggle 0.4s ease-in-out",
        shimmer: "shimmer 1.5s infinite",
        "coin-spin": "coin-spin 1.2s linear infinite",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
