/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdfbf7",
          100: "#fbf7f0",
          200: "#f5ebd6",
          300: "#e9d5b3",
          400: "#d7b585",
          500: "#c49257",
          600: "#b5682a", // Luxury bronze accent
          700: "#985220",
          800: "#7c411b",
          900: "#663418",
          955: "#3d1b0a",
        },
        surface: {
          50:  "#fafaf9", // Warm background
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
        },
        sidebar: {
          DEFAULT: "#111216", // Sleek deep charcoal
          light:   "#1b1d24",
          lighter: "#2b2e38",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card:        "0 4px 20px -2px rgba(181, 104, 42, 0.02), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        "card-hover":"0 12px 30px -4px rgba(181, 104, 42, 0.06), 0 4px 12px -2px rgba(0, 0, 0, 0.04)",
        float:       "0 20px 40px -4px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.06)",
        glow:        "0 0 0 4px rgba(181, 104, 42, 0.15)",
        "top-bar":   "0 1px 0 0 rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in":      "fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up":     "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left":"slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in":     "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer:        "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn:      { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:     { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideInLeft: { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        scaleIn:     { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        shimmer:     { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
