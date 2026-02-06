/**
 * DPEGauge — Jauge de Performance Énergétique
 * ============================================
 * Visualisation avant/après avec animation Framer Motion.
 * Design néo-banque premium + pulse sur passoire.
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { type DPELetter, DPE_KWH_VALUES } from "@/lib/constants";

interface DPEGaugeProps {
    currentDPE: DPELetter;
    targetDPE: DPELetter;
}

// Configuration des couleurs et positions pour chaque classe DPE
const DPE_CONFIG: Record<DPELetter, { color: string; position: number; bgClass: string }> = {
    G: { color: "#E07A5F", position: 7, bgClass: "bg-[#E07A5F]" },
    F: { color: "#ea580c", position: 14, bgClass: "bg-orange-600" },
    E: { color: "#f59e0b", position: 28, bgClass: "bg-amber-500" },
    D: { color: "#eab308", position: 43, bgClass: "bg-yellow-500" },
    C: { color: "#84cc16", position: 57, bgClass: "bg-lime-500" },
    B: { color: "#22c55e", position: 72, bgClass: "bg-green-500" },
    A: { color: "#16a34a", position: 86, bgClass: "bg-green-600" },
};

export function DPEGauge({ currentDPE, targetDPE }: DPEGaugeProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const currentConfig = DPE_CONFIG[currentDPE];
    const targetConfig = DPE_CONFIG[targetDPE];

    // Calcul du gain
    const dpeOrder: DPELetter[] = ["G", "F", "E", "D", "C", "B", "A"];
    const currentIndex = dpeOrder.indexOf(currentDPE);
    const targetIndex = dpeOrder.indexOf(targetDPE);
    const classesGained = targetIndex - currentIndex;

    const isPassoire = currentDPE === "G" || currentDPE === "F";

    return (
        <motion.div
            ref={ref}
            className="w-full h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Transformation Journey Layout: Stacked on mobile, Grid on MD+ */}
            <div className="flex flex-col md:grid md:grid-cols-[1fr,auto,1fr] gap-4 items-center h-full">

                {/* 1. STATE A: CURRENT */}
                <div className="w-full h-full flex flex-row items-center gap-3 sm:gap-4 bg-surface p-3 sm:p-4 rounded-2xl border border-dashed border-danger-500/30 relative overflow-hidden group">
                    <div className={`absolute inset-0 ${currentConfig.bgClass} opacity-5 group-hover:opacity-10 transition-opacity`} />

                    <div className="relative z-10 shrink-0">
                        <div className={`${currentConfig.bgClass} text-white w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg`}>
                            {currentDPE}
                        </div>
                    </div>

                    <div className="flex flex-col relative z-10 min-w-0">
                        <span className="text-[10px] sm:text-xs font-bold text-danger-500 uppercase tracking-wider mb-0.5">ÉTAT ACTUEL</span>
                        <span className="text-sm font-medium text-main truncate hover:text-clip hover:whitespace-normal transition-all">
                            {DPE_KWH_VALUES[currentDPE]} kWh/m²
                        </span>
                    </div>
                </div>

                {/* 2. TRANSITION: ARROW */}
                <div className="flex flex-col items-center justify-center z-10 px-2 py-2 md:py-0">
                    <motion.div
                        className="flex flex-row md:flex-col items-center gap-2 md:gap-1"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : {}}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Arrow Icon (Rotated on mobile) */}
                        <div className="text-muted/40 rotate-90 md:rotate-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="M12 5l7 7-7 7" />
                            </svg>
                        </div>

                        {/* Badge */}
                        <div className="px-3 py-1 bg-gradient-to-r from-success-900/40 to-success-800/40 rounded-full border border-success-500/30 backdrop-blur-sm shadow-sm whitespace-nowrap group">
                            <span className="text-xs font-bold text-success-400 group-hover:text-success-300 transition-colors">
                                +{classesGained} {classesGained > 1 ? "classes" : "classe"}
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* 3. STATE B: PROJECTED */}
                <div className="w-full h-full flex flex-row items-center justify-between md:justify-end gap-3 sm:gap-4 bg-surface p-3 sm:p-4 rounded-2xl border border-success-500/30 relative overflow-hidden group text-right">
                    <div className={`absolute inset-0 ${targetConfig.bgClass} opacity-5 group-hover:opacity-10 transition-opacity`} />

                    <div className="flex flex-col relative z-10 order-2 md:order-1 min-w-0 flex-1 md:flex-none">
                        <span className="text-[10px] sm:text-xs font-bold text-success-600 uppercase tracking-wider mb-0.5">ÉTAT PROJETÉ</span>
                        <span className="text-sm font-medium text-main truncate hover:text-clip hover:whitespace-normal transition-all">
                            {DPE_KWH_VALUES[targetDPE]} kWh/m²
                        </span>
                    </div>

                    <div className="relative z-10 order-1 md:order-2 shrink-0">
                        <div className={`${targetConfig.bgClass} text-white w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg ring-4 ring-white/10`}>
                            {targetDPE}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
