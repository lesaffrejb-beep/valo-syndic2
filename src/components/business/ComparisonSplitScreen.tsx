"use client";

import { motion } from "framer-motion";
import { type InactionCost, type ValuationResult, type FinancingPlan } from "@/lib/schemas";
import { formatCurrency } from "@/lib/calculator";
import { useViewModeStore } from "@/stores/useViewModeStore";
import { AnimatedCurrency } from "@/components/ui/AnimatedNumber";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface ComparisonSplitScreenProps {
    inactionCost: InactionCost;
    valuation: ValuationResult;
    financing: FinancingPlan;
}

export function ComparisonSplitScreen({ inactionCost, valuation, financing }: ComparisonSplitScreenProps) {
    const { getAdjustedValue } = useViewModeStore();

    // Data Calculation
    const totalLoss = getAdjustedValue(inactionCost.totalInactionCost);
    const netGain = getAdjustedValue(valuation.netROI);

    // For Visual Bars
    const cost = getAdjustedValue(financing.remainingCost);
    const valueGain = getAdjustedValue(valuation.greenValueGain);
    const maxVal = Math.max(cost, valueGain);
    const costPct = maxVal > 0 ? (cost / maxVal) * 100 : 0;
    const gainPct = maxVal > 0 ? (valueGain / maxVal) * 100 : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* LEFT: THE CRASH (Inaction) */}
            <Card variant="glass" className="border-danger/20 bg-danger/5 hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] group relative overflow-hidden h-full">
                {/* Subtle Radial Gradient for Depth */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(224,122,95,0.15),transparent_70%)] blur-3xl pointer-events-none opacity-50" />
                <CardContent className="p-8 md:p-10 flex flex-col justify-between h-full">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-danger/10 border border-danger/20 text-danger text-xs font-bold uppercase tracking-wider mb-6">
                            <AlertTriangle className="w-3 h-3" /> Scénario Inaction
                        </div>
                        <h3 className="text-3xl font-semibold text-white tracking-tight mb-2">
                            L&apos;Enlisement
                        </h3>
                        <p className="text-muted text-lg leading-relaxed">
                            Votre patrimoine s&apos;érode chaque année sous l&apos;effet de l&apos;inflation travaux et de la décote énergétique.
                        </p>
                    </div>

                    <div className="mt-12 space-y-6">
                        <div className="flex justify-between items-end border-b border-danger/10 pb-4">
                            <span className="text-muted text-sm uppercase tracking-wide">Surcoût Travaux (+3 ans)</span>
                            <span className="text-xl font-semibold text-danger tabular-nums">
                                -<AnimatedCurrency value={getAdjustedValue(inactionCost.projectedCost3Years - inactionCost.currentCost)} />
                            </span>
                        </div>
                        {inactionCost.valueDepreciation > 0 && (
                            <div className="flex justify-between items-end border-b border-danger/10 pb-4">
                                <span className="text-muted text-sm uppercase tracking-wide">Décote Passoire</span>
                                <span className="text-xl font-semibold text-danger tabular-nums">
                                    -<AnimatedCurrency value={getAdjustedValue(inactionCost.valueDepreciation)} />
                                </span>
                            </div>
                        )}
                        <div className="pt-2">
                            <p className="text-xs font-bold text-danger/70 mb-1 uppercase tracking-widest">PERTE TOTALE ESTIMÉE</p>
                            <p className="text-5xl md:text-6xl font-black bg-gradient-to-br from-danger to-danger/80 bg-clip-text text-transparent tracking-tighter financial-num">
                                -<AnimatedCurrency value={totalLoss} />
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* RIGHT: THE UPSIDE (Action) */}
            <Card variant="premium" className="group relative overflow-hidden bg-emerald-500/5 border-emerald-500/20 hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] h-full">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

                <CardContent className="p-8 md:p-10 flex flex-col justify-between h-full relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <TrendingUp className="w-3 h-3" /> Scénario Valo-Syndic
                        </div>
                        <h3 className="text-3xl font-semibold text-white tracking-tight mb-2">
                            L&apos;Investissement
                        </h3>
                        <p className="text-muted text-lg leading-relaxed">
                            Transformation en actif liquide, conforme 2050 et valorisé.
                        </p>
                    </div>

                    {/* BALANCE VISUAL & TOTAL (Grouped for alignment) */}
                    <div className="mt-12 space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                                        <motion.div
                                            className="h-full bg-rose-400/50"
                                            style={{ width: `${costPct}%` }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${costPct}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted uppercase tracking-wide">Coût Réel</p>
                                    <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(cost)}</p>
                                </div>
                                <div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                                        <motion.div
                                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            style={{ width: `${gainPct}%` }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${gainPct}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                        />
                                    </div>
                                    <p className="text-xs text-emerald-400 uppercase tracking-wide">Plus-Value</p>
                                    <p className="text-sm font-bold text-emerald-400 tabular-nums">+{formatCurrency(valueGain)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-500/10">
                            <p className="text-xs font-bold text-emerald-400/70 mb-1 uppercase tracking-widest">ENRICHISSEMENT NET</p>
                            <div className="text-5xl md:text-6xl font-black bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent tracking-tighter flex items-center gap-2 financial-num">
                                +<AnimatedCurrency value={netGain} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
