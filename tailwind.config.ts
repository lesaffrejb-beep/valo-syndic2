import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Backgrounds Deep Space
                deep: {
                    DEFAULT: "#050507", // Almost black
                    surface: "#1a1f2e", // Dark Blueish Grey
                    highlight: "#252b3d",
                },
                // Gold Premium (Refined)
                gold: {
                    DEFAULT: "#E5C07B",
                    light: "#F2D8A7",
                    dark: "#997D3D",
                    dim: "rgba(229, 192, 123, 0.1)",
                },
                // Earthy Tones - Stealth Wealth Finance
                terracotta: {
                    DEFAULT: "hsl(10, 60%, 65%)", // Softer Terracotta
                    light: "#F2CCB7",
                    dark: "#3D1F16",
                    muted: "hsl(10, 40%, 50%)", // For text
                },
                // Functional Colors (Muted/Pastel)
                success: { DEFAULT: '#34D399', glow: 'rgba(52, 211, 153, 0.1)' }, // Emerald
                warning: { DEFAULT: '#FBBF24', glow: 'rgba(251, 191, 36, 0.1)' }, // Amber
                danger: { DEFAULT: 'hsl(10, 60%, 65%)', glow: 'rgba(224, 122, 95, 0.1)' }, // Replaced Red with Terracotta
                info: { DEFAULT: '#60A5FA', glow: 'rgba(96, 165, 250, 0.1)' },   // Soft Blue

                // Text Colors
                main: "#EDEDED",      // High contrast text
                muted: "#94A3B8",     // Secondary text
                subtle: "#475569",    // Tertiary/Borders
            },
            fontFamily: {
                sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "monospace"],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                'glass-border': 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
                'dots-pattern': "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
            },
            boxShadow: {
                'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
                'neon': '0 0 20px -5px rgba(229, 192, 123, 0.3)',
                'card-premium': '0 20px 40px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            },
            animation: {
                'fadeInUp': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
