import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // ── Backgrounds ──────────────────────────────────────
                alabaster: "#F9F8F6",      // App background — warm off-white
                card: "#FFFFFF",           // Card / panel surface

                // ── Text ─────────────────────────────────────────────
                oxford: "#111827",         // Primary text — deep navy-black
                slate: "#475569",          // Secondary / muted text
                subtle: "#94A3B8",         // Tertiary / placeholders

                // ── Accents ──────────────────────────────────────────
                brass: {
                    DEFAULT: "#B8963E",    // Primary action / highlights
                    light: "#D4B066",      // Hover state
                    dark: "#8A6F2E",       // Active / pressed
                    muted: "rgba(184, 150, 62, 0.08)", // Subtle bg tint
                },
                navy: {
                    DEFAULT: "#1E3A8A",    // Structural / headers
                    light: "#2B4FAF",      // Hover
                    dark: "#162D6B",       // Active
                },

                // ── Status (Muted / Institutional) ───────────────────
                gain: {
                    DEFAULT: "#166534",    // Financial gains — forest green
                    light: "#DCFCE7",      // Light background
                },
                cost: {
                    DEFAULT: "#991B1B",    // Costs / alerts — crimson
                    light: "#FEE2E2",      // Light background
                },
                info: {
                    DEFAULT: "#1E40AF",    // Informational — deep blue
                    light: "#DBEAFE",      // Light background
                },

                // ── Borders ──────────────────────────────────────────
                border: "#E2E8F0",         // Fine 1px border — slate-200
                "border-strong": "#CBD5E1", // Emphasized border — slate-300
            },
            fontFamily: {
                serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
                sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
                'elevated': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
                'modal': '0 20px 60px -15px rgba(0, 0, 0, 0.12)',
            },
            borderRadius: {
                'card': '0.625rem',   // 10px — slightly rounded, not playful
                'button': '0.5rem',    // 8px
                'input': '0.5rem',     // 8px
            },
            animation: {
                'fadeInUp': 'fadeInUp 0.5s cubic-bezier(0.33, 1, 0.68, 1) forwards',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
