"use client";

import { motion } from "framer-motion";
import { type QuarterlyStats } from "@/services/dpeService";

interface EnergyBenchmarkProps {
    stats: QuarterlyStats;
    surface?: number; // m² pour calcul personnalisé
}

/**
 * Comparateur Énergétique Quartier - V2 Quick Win
 * Affiche la comparaison avec la moyenne du quartier
 */
export function EnergyBenchmark({ stats, surface = 100 }: EnergyBenchmarkProps) {
    const isPositive = !stats.isAboveAverage;

    // Recalcul avec surface réelle
    const personalYearlyCost = stats.targetConso * surface * 0.25;
    const personalSavings = Math.max(0, (stats.targetConso - stats.averageConso) * surface * 0.25);

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="card-bento rounded-2xl p-4 border border-boundary group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-main flex items-center gap-2">
                    📊 Comparatif Quartier
                </h3>
                <span className="text-xs text-muted">
                    {stats.sampleSize} bâtiments
                </span>
            </div>

            {/* Main Stat */}
            <div className={`
                flex items-center justify-center gap-3 p-3 rounded-xl mb-3
                ${isPositive
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20'}
            `}>
                <span className="text-2xl">
                    {isPositive ? '📉' : '📈'}
                </span>
                <div>
                    <p className={`text-xl font-bold ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isPositive ? '' : '+'}{Math.abs(stats.percentDiff).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted">
                        {isPositive ? 'sous la moyenne' : 'au-dessus de la moyenne'}
                    </p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-surface p-2 rounded-lg border border-boundary">
                    <span className="text-muted">⚡ Votre conso</span>
                    <p className="font-bold text-main">
                        {stats.targetConso} <span className="text-muted">kWh/m²</span>
                    </p>
                </div>
                <div className="bg-surface p-2 rounded-lg border border-boundary">
                    <span className="text-muted">📊 Moyenne</span>
                    <p className="font-bold text-main">
                        {stats.averageConso.toFixed(0)} <span className="text-muted">kWh/m²</span>
                    </p>
                </div>
            </div>

            {/* Cost & Savings */}
            <div className="bg-surface p-2 rounded-lg border border-boundary text-xs">
                <div className="flex justify-between">
                    <span className="text-muted">💰 Coût annuel ({surface}m²)</span>
                    <span className="font-bold text-main">{formatCurrency(personalYearlyCost)}</span>
                </div>
                {!isPositive && personalSavings > 0 && (
                    <p className="text-amber-400 mt-1">
                        💡 Économie potentielle : <strong>{formatCurrency(personalSavings)}/an</strong>
                    </p>
                )}
            </div>

            {/* Argumentaire */}
            {!isPositive && (
                <p className="text-xs text-muted mt-2 italic">
                    &quot;Vos charges de chauffage sont {Math.abs(stats.percentDiff).toFixed(0)}% supérieures
                    à la moyenne du quartier. Ce n&apos;est pas une fatalité, c&apos;est de l&apos;isolation manquante.&quot;
                </p>
            )}
        </motion.div>
    );
}
