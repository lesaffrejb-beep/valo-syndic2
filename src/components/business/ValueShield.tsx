"use client";

import { motion } from "framer-motion";
import { Shield, TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/calculator";
import { type ValuationResult, type FinancingPlan } from "@/lib/schemas";
import { useViewModeStore } from "@/stores/useViewModeStore";

interface ValueShieldProps {
    valuation: ValuationResult;
    financing?: FinancingPlan;
    marketTrend?: {
        national: number;
        comment?: string;
    };
    isPassoire?: boolean;
    className?: string;
}

/**
 * VALUE SHIELD — "L'Actif Patrimonial"
 * Design: Stock market ticker style avec protection de valeur
 *
 * Philosophie: Traiter le +624k€ comme un actif boursier.
 * Contexte marché, tendance, timestamp pour crédibilité maximale.
 */
export function ValueShield({
    valuation,
    financing,
    marketTrend,
    isPassoire = false,
    className = ""
}: ValueShieldProps) {
    const { viewMode, getAdjustedValue } = useViewModeStore();
    const isMaPoche = viewMode === 'maPoche';

    // Adjusted values based on view mode
    const displayGreenValueGain = getAdjustedValue(valuation.greenValueGain);
    const displayNetROI = getAdjustedValue(valuation.netROI);
    const displayRemainingCost = financing ? getAdjustedValue(financing.remainingCost) : 0;

    // Market context
    const isMarketDown = marketTrend ? marketTrend.national < 0 : false;
    const isProtection = isMarketDown || isPassoire;

    // Color logic
    const trendColor = displayNetROI >= 0 ? "text-emerald-400" : "text-amber-400";
    const trendBg = displayNetROI >= 0 ? "bg-emerald-500/10" : "bg-amber-500/10";
    const trendBorder = displayNetROI >= 0 ? "border-emerald-500/20" : "border-amber-500/20";
    const glowColor = displayNetROI >= 0
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(245, 158, 11, 0.3)";

    // Data freshness
    const now = new Date();
    const dataAge = "Mis à jour il y a 2h"; // TODO: Calculate from actual data timestamp

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative bg-charcoal bg-glass-gradient rounded-3xl border border-white/10
                shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.1)]
                backdrop-blur-xl overflow-hidden group ${className}`}
        >
            {/* TEXTURE & GLOW */}
            <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />
            <div
                className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] transition-all duration-700"
                style={{
                    background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
                }}
            />

            {/* HEADER - Stock Ticker Style */}
            <div className="p-6 pb-5 border-b border-white/10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center
                            ${isProtection
                                ? 'bg-cyan-500/10 border-cyan-500/30'
                                : 'bg-emerald-500/10 border-emerald-500/30'
                            }`}>
                            <Shield className={`w-5 h-5 ${isProtection ? 'text-cyan-400' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {isProtection ? "Protection Capital" : "Valorisation"}
                            </h3>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">
                                {isMaPoche ? "Mon Actif" : "Actif Global"}
                            </p>
                        </div>
                    </div>

                    {/* Live Status */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Live</span>
                    </div>
                </div>
            </div>

            {/* MAIN TICKER */}
            <div className="p-8">
                {/* PRIMARY VALUE - Stock Display */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`relative rounded-2xl border-2 p-6 mb-6
                        ${isProtection
                            ? 'bg-cyan-500/5 border-cyan-500/20'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                    style={{
                        boxShadow: isProtection
                            ? '0 0 40px rgba(34, 211, 238, 0.1), inset 0 2px 16px rgba(0,0,0,0.3)'
                            : '0 0 40px rgba(16, 185, 129, 0.1), inset 0 2px 16px rgba(0,0,0,0.3)'
                    }}
                >
                    {/* Label */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">
                            {isProtection ? "Capital Protégé" : "Plus-Value Estimée"}
                        </span>
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border
                            ${isProtection
                                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                            {isProtection ? '🛡️ SÉCURISÉ' : `+${formatPercent(valuation.greenValueGainPercent)}`}
                        </div>
                    </div>

                    {/* Value Display */}
                    <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-2">
                            <span
                                className={`text-6xl font-black tracking-tighter tabular-nums
                                    ${isProtection ? 'text-cyan-400' : 'text-emerald-400'}`}
                                style={{
                                    textShadow: isProtection
                                        ? '0 0 32px rgba(34, 211, 238, 0.3)'
                                        : '0 0 32px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                +{formatCurrency(displayGreenValueGain)}
                            </span>
                        </div>

                        {/* Trend Indicator */}
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${trendBg} ${trendBorder}`}>
                            <TrendingUp className={`w-4 h-4 ${trendColor}`} />
                            <span className={`text-xs font-bold ${trendColor}`}>
                                +{formatPercent(valuation.greenValueGainPercent)}
                            </span>
                        </div>
                    </div>

                </motion.div>

                {/* MARKET CONTEXT ALERT */}
                {isMarketDown && marketTrend && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/10">
                                <TrendingDown className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] uppercase tracking-widest text-amber-400/60 font-bold mb-1">
                                    Contexte Marché
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Tendance nationale : <span className="text-amber-400 font-bold">{(marketTrend.national * 100).toFixed(1)}%</span>.
                                    {isPassoire && (
                                        <span className="text-amber-300">
                                            {" "}Sans rénovation, votre bien subit cette baisse + la décote énergétique.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* NET ROI CALCULATION */}
                <div className="border-t border-white/5 pt-6 space-y-4">
                    {/* Breakdown */}
                    <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center px-3 py-1.5">
                            <span className="text-white/40">Plus-value Valeur Verte</span>
                            <span className="text-emerald-400 font-bold tabular-nums">
                                +{formatCurrency(displayGreenValueGain)}
                            </span>
                        </div>
                        {financing && (
                            <div className="flex justify-between items-center px-3 py-1.5">
                                <span className="text-white/40">Reste à charge travaux</span>
                                <span className="text-amber-400 font-bold tabular-nums">
                                    -{formatCurrency(displayRemainingCost)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 px-3">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-mono">Résultat Net</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>

                    {/* NET RESULT */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`relative rounded-2xl border p-5 ${trendBg} ${trendBorder}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                                    Gain Net Patrimonial
                                </div>
                                <div className="text-[9px] text-white/20 font-mono italic">
                                    (Après déduction coût travaux)
                                </div>
                            </div>

                            <div className={`text-right ${trendColor}`}>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black tracking-tighter tabular-nums">
                                        {displayNetROI >= 0 ? '+' : ''}{formatCurrency(displayNetROI)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Performance Badge */}
                    <div className="flex justify-center mt-4">
                        <div className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-wide
                            ${displayNetROI >= 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                            {displayNetROI >= 0 ? '✓ Opération Rentable' : '⚡ Investissement Requis'}
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
