"use client";

import { motion } from "framer-motion";
import { formatPercent } from "@/lib/calculator";
import { BarChart3, TrendingUp } from "lucide-react";

interface MarketLiquidityAlertProps {
    shareOfSales: number;
}

export function MarketLiquidityAlert({ shareOfSales }: MarketLiquidityAlertProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="p-2 bg-zinc-900 rounded-lg border border-white/5">
                        <BarChart3 className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/30 border border-amber-900/30 rounded-full">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Alerte Liquidité</span>
                    </div>
                </div>

                <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-[0.1em] mb-4">
                    Marché des Passoires (E/F/G)
                </h3>

                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-mono font-bold text-amber-500 tabular-nums">
                        {formatPercent(shareOfSales)}
                    </span>
                    <TrendingUp className="w-5 h-5 text-amber-500/50" />
                </div>

                <p className="text-sm text-zinc-500 leading-relaxed">
                    Part des transactions réalisées par des passoires thermiques au cours des 12 derniers mois.
                </p>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-900/50">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                    <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Risque de liquidité</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${shareOfSales * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 font-mono">
                    ANALYTICS ENGINE V4.2 — VALO-SYNDIC
                </p>
            </div>
        </motion.div>
    );
}
