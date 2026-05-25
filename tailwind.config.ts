import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cinematic dark palette
        ink: {
          950: "#070709",
          900: "#0b0b10",
          800: "#111118",
          700: "#1a1a24",
        },
        // Brand accent — Cinematic Gold
        gold: {
          50: "#fbf6e2",
          100: "#f5ecc4",
          200: "#ecdc8c",
          300: "#e0c757",
          400: "#d4af37", // primary brand gold
          500: "#b8962d",
          600: "#8f721f",
          700: "#6a5418",
          800: "#473811",
          900: "#241c08",
        },
        cyan: {
          glow: "#7ff4ff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Playfair Display", "serif"],
        sans: ["var(--font-body)", "Outfit", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "radial-gold":
          "radial-gradient(circle at 20% 10%, rgba(212,175,55,0.18), transparent 55%)",
        "radial-cyan":
          "radial-gradient(circle at 85% 90%, rgba(127,244,255,0.10), transparent 55%)",
        "noise":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.83 0 0 0 0 0.69 0 0 0 0 0.22 0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212,175,55,0.35), 0 10px 40px -10px rgba(212,175,55,0.45)",
        glass:
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 30px 60px -20px rgba(0,0,0,0.55)",
        glow: "0 0 60px rgba(212,175,55,0.35)",
      },
      keyframes: {
        "gold-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(212,175,55,0.55), 0 0 30px rgba(212,175,55,0.25)",
          },
          "50%": {
            boxShadow:
              "0 0 0 18px rgba(212,175,55,0), 0 0 60px rgba(212,175,55,0.45)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "gold-pulse": "gold-pulse 2.4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
