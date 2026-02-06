"use client";

import { motion } from "framer-motion";
import { TrendingDown, Zap } from "lucide-react";
import { useViewModeStore } from "@/stores/useViewModeStore";

interface HeroMetricProps {
    monthlyPayment: number;
    totalCost: number;
    durationYears?: number;
    energySavings?: number;
    className?: string;
}

/**
 * HERO METRIC — Le "Money Shot" du Cockpit
 * Design: Stealth Wealth — Gold on Obsidian, Maximum Impact
 *
 * Philosophie: Ce chiffre doit écraser visuellement le coût total.
 * C'est la transformation psychologique: 300k€ → 75€/mois
 */
export function HeroMetric({
    monthlyPayment,
    totalCost,
    durationYears = 20,
    energySavings = 0,
    className = ""
}: HeroMetricProps) {
    const { viewMode } = useViewModeStore();
    const isMaPoche = viewMode === 'maPoche';

    // Effort Net = Mensualité - Économie Énergie Mensuelle
    const netEffort = monthlyPayment - energySavings;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`relative bg-charcoal bg-glass-gradient rounded-3xl border border-white/10
                shadow-[0_20px_70px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)]
                backdrop-blur-xl overflow-hidden group ${className}`}
        >
            {/* TEXTURE & EFFECTS */}
            <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gold/10 blur-[120px] group-hover:bg-gold/15 transition-all duration-700" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

            {/* CONTENT */}
            <div className="relative z-10 p-10 lg:p-14">
                <div className="flex items-start justify-between mb-8">
                    {/* LEFT: Label */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                            <h2 className="text-[11px] uppercase tracking-[0.3em] text-gold/60 font-bold mb-1">
                                {isMaPoche ? "Mon Effort Mensuel" : "Mensualité Projet"}
                            </h2>
                            <p className="text-xs text-white/30 font-mono">
                                Financement 0% • {durationYears} ans
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: Context Badge */}
                    <div className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Live</span>
                    </div>
                </div>

                {/* THE MONEY SHOT */}
                <div className="mb-6">
                    <div className="flex items-end gap-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-baseline gap-2"
                        >
                            <span
                                className="font-black tracking-tighter leading-none text-gradient-gold tabular-nums
                                    text-[clamp(64px,12vw,128px)]"
                                style={{
                                    textShadow: "0 0 40px rgba(212, 175, 55, 0.3), 0 2px 8px rgba(0,0,0,0.8)"
                                }}
                            >
                                {Math.round(monthlyPayment)}
                            </span>
                            <div className="flex flex-col pb-3 lg:pb-5">
                                <span className="text-3xl lg:text-4xl font-bold text-gold leading-none">€</span>
                                <span className="text-sm lg:text-base text-white/50 font-semibold leading-none mt-1">/mois</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Energy Savings Context */}
                    {energySavings > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 bg-success/5 border border-success/10 rounded-2xl"
                        >
                            <TrendingDown className="w-4 h-4 text-success" />
                            <div className="text-sm">
                                <span className="text-white/50">Effort net estimé : </span>
                                <span className="text-white font-bold">{Math.round(netEffort)}€/mois</span>
                                <span className="text-success/70 text-xs ml-2">(après économie énergie ~{Math.round(energySavings)}€)</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* COMPARISON BAR — La Désamorce Psychologique */}
                <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                            vs Coût Total Projet
                        </span>
                        <span className="text-xs text-white/20 font-mono line-through">
                            {(totalCost / 1000).toFixed(0)}k€
                        </span>
                    </div>

                    {/* Visual Comparison */}
                    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((monthlyPayment / (totalCost / (durationYears * 12))) * 100, 100)}%` }}
                            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold/50 rounded-full"
                            style={{
                                boxShadow: "0 0 12px rgba(212, 175, 55, 0.4)"
                            }}
                        />
                    </div>

                    <p className="text-[10px] text-white/20 mt-2 text-center font-mono">
                        Étalé sur {durationYears} ans = Transformation psychologique du coût
                    </p>
                </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </motion.div>
    );
}
