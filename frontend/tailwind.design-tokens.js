/**
 * Design Tokens Reference (NOT auto-loaded by Tailwind v4)
 * ─────────────────────────────────────────────────────────
 * Gen Z + Zen aesthetic — dark-first SaaS design system.
 *
 * Tailwind v4 uses CSS-first config via @theme in src/index.css.
 * This file is a JS reference of the same tokens for documentation,
 * tooling (e.g., Storybook, Figma export), or future migration.
 *
 * The ACTUAL tokens live in  src/index.css  → @theme { ... }
 * and keyframe animations.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  /* ── Dark mode ──────────────────────────────────────────────── */
  darkMode: "class",

  /* ── Content paths ──────────────────────────────────────────── */
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      /* ── Colors ─────────────────────────────────────────────── */
      colors: {
        // Brand palette
        primary: {
          DEFAULT: "#7C3AED", // vibrant violet
          light: "#A78BFA",
          dark: "#5B21B6",
        },
        secondary: {
          DEFAULT: "#1E293B", // deep blue
          light: "#334155",
          dark: "#0F172A",
        },
        accent: {
          DEFAULT: "#22D3EE", // cyan pop
          light: "#67E8F9",
          dark: "#0891B2",
        },

        // Surfaces
        background: "#0F172A", // dark gradient base
        surface: "rgba(255, 255, 255, 0.05)", // glass surface
        "surface-raised": "rgba(255, 255, 255, 0.08)",
        "surface-overlay": "rgba(255, 255, 255, 0.12)",

        // Borders
        border: "rgba(255, 255, 255, 0.1)", // subtle white opacity
        "border-glow": "#7C3AED",

        // Text
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-muted": "#64748B",

        // Glass
        glass: "rgba(15, 23, 42, 0.72)",
        "glass-border": "rgba(124, 58, 237, 0.15)",

        // Semantic
        success: "#34D399",
        error: "#FB7185",
        warning: "#FBBF24",
      },

      /* ── Typography ─────────────────────────────────────────── */
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },

      /* ── Border radius ──────────────────────────────────────── */
      borderRadius: {
        xl: "16px", // buttons, inputs
        "2xl": "24px", // cards, panels
      },

      /* ── Backdrop blur ──────────────────────────────────────── */
      backdropBlur: {
        glass: "12px", // standard glassmorphism
        strong: "20px", // heavy frosted glass
      },

      /* ── Box shadows ────────────────────────────────────────── */
      boxShadow: {
        "soft-glow":
          "0 0 20px rgba(124, 58, 237, 0.15), 0 0 60px rgba(124, 58, 237, 0.05)",
        card: "0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)",
        "card-hover":
          "0 12px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(124, 58, 237, 0.1)",
      },

      /* ── Animations ─────────────────────────────────────────── */
      animation: {
        "fade-in": "fadeIn 0.35s ease-out both",
        "scale-in": "scaleIn 0.25s ease-out both",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },

      /* ── Keyframes ──────────────────────────────────────────── */
      keyframes: {
        /* Fade in with subtle upward slide */
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        /* Scale from slightly smaller to full size */
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        /* Soft breathing violet glow */
        pulseGlow: {
          "0%, 100%": {
            boxShadow:
              "0 0 15px rgba(124, 58, 237, 0.1), 0 0 0 0 rgba(124, 58, 237, 0)",
          },
          "50%": {
            boxShadow:
              "0 0 25px rgba(124, 58, 237, 0.25), 0 0 0 6px rgba(124, 58, 237, 0.06)",
          },
        },
      },
    },
  },

  plugins: [],

  /**
   * ── Custom Utility Classes (defined in src/index.css via @utility) ──
   *
   * GLASSMORPHISM
   *   .glass          — frosted panel (blur-glass + glass bg + glass-border)
   *   .glass-strong   — heavier frost (blur-strong + soft-glow shadow)
   *   .glass-subtle   — barely-there tint, no visible border
   *
   * GRADIENT BACKGROUNDS
   *   .gradient-dark    — vertical dark sweep (background → secondary → background)
   *   .gradient-radial  — centered violet radial glow
   *   .gradient-mesh    — multi-stop violet/cyan/purple mesh
   *   .gradient-accent  — diagonal violet → cyan sweep
   *
   * CARD PRESETS
   *   .card          — elevated glass card with shadow-card
   *   .card-hover    — card + interactive lift/glow on :hover
   *   .card-flat     — border-only card, no shadow
   */
};
