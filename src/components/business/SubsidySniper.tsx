"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/calculator";

interface SubsidySniperProps {
    totalSubsidies: number;
    totalWorkCost: number;
    mprAmount: number;
    ceeAmount: number;
    amoAmount: number;
    localAidAmount: number;
    className?: string;
}

/**
 * SUBSIDY SNIPER — "L'Optimisateur Radical"
 * Design: Cible de précision + Pourcentage d'aides récupérées
 *
 * Philosophie: Montrer visuellement qu'on a "snipé" le maximum d'aides possibles.
 * Le % devient un score de performance.
 */
export function SubsidySniper({
    totalSubsidies,
    totalWorkCost,
    mprAmount,
    ceeAmount,
    amoAmount,
    localAidAmount,
    className = ""
}: SubsidySniperProps) {
    // Calculate subsidy capture rate
    const captureRate = (totalSubsidies / totalWorkCost) * 100;
    const isExcellent = captureRate >= 40;
    const isGood = captureRate >= 25;

    // Color logic
    const accentColor = isExcellent ? "text-emerald-400" : isGood ? "text-blue-400" : "text-amber-400";
    const glowColor = isExcellent
        ? "rgba(16, 185, 129, 0.3)"
        : isGood
            ? "rgba(59, 130, 246, 0.3)"
            : "rgba(245, 158, 11, 0.3)";

    // Breakdown
    const subsidies = [
        { label: "MaPrimeRénov'", amount: mprAmount, color: "bg-emerald-500" },
        { label: "CEE", amount: ceeAmount, color: "bg-blue-500" },
        { label: "AMO", amount: amoAmount, color: "bg-purple-500" },
        { label: "Aides Locales", amount: localAidAmount, color: "bg-amber-500" },
    ].filter(s => s.amount > 0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative bg-charcoal bg-glass-gradient rounded-3xl border border-white/10
                shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.1)]
                backdrop-blur-xl overflow-hidden group ${className}`}
        >
            {/* TEXTURE */}
            <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

            {/* HEADER */}
            <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-electricBlue/20 to-electricBlue/5 border border-electricBlue/20 flex items-center justify-center">
                            <Target className="w-4 h-4 text-electricBlue" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Subsidy Sniper</h3>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">Optimisation Radicale</p>
                        </div>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-success/10 border border-success/20 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="text-[10px] font-bold text-success uppercase tracking-wide">Maximisé</span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="p-8">
                {/* TARGET VISUALIZATION */}
                <div className="flex items-center justify-center mb-8">
                    <div className="relative">
                        {/* Outer Rings (Target) */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="absolute inset-0 -m-8 rounded-full border-2 border-dashed border-white/10"
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="absolute inset-0 -m-4 rounded-full border border-dashed border-white/20"
                        />

                        {/* Center Circle */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                            className={`relative w-36 h-36 rounded-full border-4 border-white/20
                                flex items-center justify-center ${accentColor}`}
                            style={{
                                background: `radial-gradient(circle, rgba(10,11,13,0.9) 0%, rgba(18,19,26,0.8) 100%)`,
                                boxShadow: `0 0 40px ${glowColor}, inset 0 2px 16px rgba(0,0,0,0.6)`
                            }}
                        >
                            {/* Crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-[1px] bg-white/10" />
                                <div className="absolute w-[1px] h-full bg-white/10" />
                            </div>

                            {/* Percentage */}
                            <div className="relative z-10 text-center">
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6, duration: 0.4 }}
                                    className="text-5xl font-black tracking-tighter"
                                    style={{
                                        textShadow: `0 0 20px ${glowColor}`
                                    }}
                                >
                                    {Math.round(captureRate)}
                                </motion.span>
                                <span className="text-xl font-bold opacity-80">%</span>
                                <p className="text-[9px] uppercase tracking-wider text-white/40 mt-1">Capturé</p>
                            </div>

                            {/* Pulse Ring */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0, 0.3]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className={`absolute inset-0 rounded-full border-2 ${accentColor.replace('text-', 'border-')}`}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* TOTAL AMOUNT */}
                <div className="text-center mb-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-2">
                        Aides Totales Récupérées
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter">
                            {formatCurrency(totalSubsidies)}
                        </span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 font-mono">
                        sur {formatCurrency(totalWorkCost)} de travaux
                    </p>
                </div>

                {/* BREAKDOWN */}
                <div className="space-y-2">
                    {subsidies.map((subsidy, idx) => {
                        const percentage = (subsidy.amount / totalSubsidies) * 100;
                        return (
                            <motion.div
                                key={subsidy.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + idx * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-white/60">{subsidy.label}</span>
                                        <span className="text-xs font-bold text-white tabular-nums">
                                            {formatCurrency(subsidy.amount)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: 0.8 + idx * 0.1, duration: 0.6 }}
                                            className={`h-full ${subsidy.color} rounded-full`}
                                            style={{
                                                boxShadow: `0 0 8px ${subsidy.color.replace('bg-', 'rgba(').replace('-500', ', 0.4)')}`
                                            }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER BADGE */}
            <div className="px-6 py-3 bg-surface-highlight/30 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-white/20 font-mono">
                    Taux de Récupération
                </span>
                <div className={`px-2 py-0.5 rounded ${isExcellent ? 'bg-emerald-500/20 text-emerald-400' : isGood ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <span className="text-[9px] font-bold uppercase">
                        {isExcellent ? '⭐ Excellent' : isGood ? '✓ Bon' : '⚡ Modéré'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
