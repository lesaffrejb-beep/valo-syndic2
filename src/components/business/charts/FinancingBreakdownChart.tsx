"use client";

import { motion } from "framer-motion";
import { type FinancingPlan } from "@/lib/schemas";

interface FinancingBreakdownChartProps {
    financing: FinancingPlan;
}

// Design System Colors
const COLORS = {
    mpr: "#22c55e",      // success-500
    cee: "#8b5cf6",      // violet-500 (NEW)
    ptz: "#D4B679",      // gold (primary)
    local: "#10b981",    // emerald-500
    reste: "#6b7280",    // gray-500
};

export function FinancingBreakdownChart({ financing }: FinancingBreakdownChartProps) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(value);

    // Calculate total actual financing needed (TTC)
    const totalFinancedAmount = financing.mprAmount + financing.amoAmount + financing.ceeAmount + financing.localAidAmount + financing.ecoPtzAmount + financing.remainingCost;

    // Percentages based on Total TTC (Real Project Cost)
    const totalCost = totalFinancedAmount;
    const mprPercent = Math.round((financing.mprAmount / totalCost) * 100);
    const amoPercent = Math.round((financing.amoAmount / totalCost) * 100);
    const ceePercent = financing.ceeAmount > 0
        ? Math.round((financing.ceeAmount / totalCost) * 100)
        : 0;
    const ptzPercent = Math.round((financing.ecoPtzAmount / totalCost) * 100);
    const localPercent = financing.localAidAmount > 0
        ? Math.round((financing.localAidAmount / totalCost) * 100)
        : 0;
    const remainingPercent = Math.round((financing.remainingCost / totalCost) * 100);

    // Data for bars
    const bars = [
        {
            id: "mpr",
            label: "MaPrimeRénov'",
            sublabel: "Travaux",
            value: financing.mprAmount,
            percent: mprPercent,
            color: COLORS.mpr,
        },
        ...(financing.amoAmount > 0 ? [{
            id: "amo",
            label: "MaPrimeRénov'",
            sublabel: "Ingénierie (AMO)",
            value: financing.amoAmount,
            percent: amoPercent,
            color: "#4ade80", // success-400 (lighter green)
        }] : []),
        ...(financing.ceeAmount > 0 ? [{
            id: "cee",
            label: "Primes CEE",
            sublabel: "Certificats Énergie",
            value: financing.ceeAmount,
            percent: ceePercent,
            color: COLORS.cee,
        }] : []),
        ...(financing.localAidAmount > 0 ? [{
            id: "local",
            label: "Aides locales",
            sublabel: "Collectivités",
            value: financing.localAidAmount,
            percent: localPercent,
            color: COLORS.local,
        }] : []),
        {
            id: "ptz",
            label: "Éco-PTZ",
            sublabel: "Prêt 0% sur 20 ans",
            value: financing.ecoPtzAmount,
            percent: ptzPercent,
            color: COLORS.ptz,
        },
        ...(financing.remainingCost > 0 ? [{
            id: "reste",
            label: "Apport Personnel",
            sublabel: "Reste à charge cash",
            value: financing.remainingCost,
            percent: remainingPercent,
            color: COLORS.reste,
        }] : []),
    ];

    // Calculate total coverage (Subsidies + Loan)
    const totalCoverage = financing.mprAmount + financing.amoAmount + financing.ceeAmount + financing.localAidAmount + financing.ecoPtzAmount;
    const coveragePercent = Math.round((totalCoverage / totalCost) * 100);

    return (
        <div className="card-bento p-6 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-main flex items-center gap-2">
                    💰 Répartition du financement
                </h3>
                <div className="text-right">
                    <p className="text-xs text-muted uppercase">Couverture totale</p>
                    <p className={`text-lg font-bold ${coveragePercent >= 100 ? 'text-success-500' : 'text-warning-500'}`}>
                        {coveragePercent}%
                    </p>
                </div>
            </div>

            {/* Explanation */}
            <div className="mb-6 p-3 bg-primary-900/10 border border-primary-500/20 rounded-lg">
                <p className="text-xs text-primary-300">
                    💡 <strong>Comment lire :</strong> Chaque barre représente le % du coût total TTC du projet.
                    L&apos;Éco-PTZ et l&apos;Apport comblent le reste à charge après aides.
                </p>
            </div>

            {/* Horizontal Bars */}
            <div className="space-y-5">
                {bars.map((bar, index) => (
                    <motion.div
                        key={bar.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {/* Label row */}
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: bar.color }}
                                />
                                <span className="text-sm font-medium text-main">{bar.label}</span>
                                <span className="text-xs text-muted">({bar.sublabel})</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-main">
                                    {formatCurrency(bar.value)}
                                </span>
                                <span className="text-xs text-muted ml-2">({bar.percent}%)</span>
                            </div>
                        </div>

                        {/* Bar track */}
                        <div className="h-3 bg-surface rounded-full overflow-hidden border border-boundary">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: bar.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(bar.percent, 100)}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: "easeOut" }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Summary box */}
            <div className="mt-6 pt-4 border-t border-boundary">
                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-boundary">
                    <div>
                        <p className="text-sm font-medium text-main">Coût total du projet</p>
                        <p className="text-xs text-muted">Travaux + frais (HT)</p>
                    </div>
                    <p className="text-xl font-bold text-main">{formatCurrency(totalCost)}</p>
                </div>

                {/* Coverage indicator */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted">Taux de couverture (aides + prêt)</span>
                        <span className={`text-sm font-bold ${coveragePercent >= 100 ? 'text-success-500' : 'text-warning-500'}`}>
                            {coveragePercent}%
                        </span>
                    </div>
                    <div className="h-2 bg-boundary rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${coveragePercent >= 100 ? 'bg-success-500' : 'bg-warning-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(coveragePercent, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                        />
                    </div>
                    <p className="text-xs text-muted mt-2">
                        {coveragePercent >= 100
                            ? "✅ Surcouverture : Les aides + prêt couvrent 100% du projet"
                            : `⚠️ Reste à charge : ${formatCurrency(financing.remainingCost)}`
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
