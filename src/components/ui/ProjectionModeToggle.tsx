"use client";

import { useState, useEffect } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useProjectionMode } from "@/hooks/useProjectionMode";

export function ProjectionModeToggle() {
    const { isProjectionMode, toggleProjectionMode } = useProjectionMode();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) return null;

    return (
        <button
            onClick={toggleProjectionMode}
            className={`
                group flex items-center gap-2 h-10 px-3 rounded-lg transition-all duration-300 border border-transparent
                ${isProjectionMode
                    ? "bg-gold text-black shadow-[0_0_20px_rgba(229,192,123,0.4)] border-gold/30"
                    : "bg-transparent text-muted hover:text-white hover:bg-white/5 hover:border-white/10"
                }
            `}
            title={isProjectionMode ? "Désactiver Mode Projection (AG)" : "Activer Mode Projection (AG)"}
        >
            <div className="relative w-3.5 h-3.5">
                <Monitor className={`w-3.5 h-3.5 transition-all ${isProjectionMode ? "scale-100" : "scale-100"}`} />
                {isProjectionMode && (
                    <motion.div
                        layoutId="active-glow"
                        className="absolute inset-0 bg-white/50 blur-lg rounded-full"
                    />
                )}
            </div>
            <span className="text-[10px] xl:text-[11px] font-medium tracking-[0.15em] uppercase">
                <span className="hidden 2xl:inline">{isProjectionMode ? "Mode AG ON" : "Mode AG"}</span>
                <span className="2xl:hidden">{isProjectionMode ? "AG ON" : "AG"}</span>
            </span>
        </button>
    );
}
