/**
 * CostValueBalance — "Cost vs Value" Balance Chart
 * A simple horizontal bar comparison: Cost (Red) vs Value Gain (Green)
 * The ultimate argument for investors: "You're not spending, you're gaining."
 *
 * AUDIT 31/01/2026: Corrigé pour transparence sur Éco-PTZ
 * - "0€" signifie "0€ d'apport" mais le prêt doit être remboursé
 * - Affiche toujours la mensualité même si reste à charge = 0
 */

"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/calculator";
import { useViewModeStore } from "@/stores/useViewModeStore";

interface CostValueBalanceProps {
    /** The remaining cost after subsidies (expense) */
    cost: number;
    /** The green value gain (patrimony increase) */
    valueGain: number;
    /** Éco-PTZ amount if applicable */
    ecoPtzAmount?: number;
    /** Monthly payment for Éco-PTZ */
    monthlyPayment?: number;
}

export function CostValueBalance({ cost, valueGain, ecoPtzAmount = 0, monthlyPayment = 0 }: CostValueBalanceProps) {
    const { getAdjustedValue, viewMode } = useViewModeStore();
    const isMaPoche = viewMode === 'maPoche';

    const displayCost = getAdjustedValue(cost);
    const displayValueGain = getAdjustedValue(valueGain);
    const displayEcoPtz = getAdjustedValue(ecoPtzAmount);
    const displayMonthly = getAdjustedValue(monthlyPayment);

    // Détermine si le financement est via Éco-PTZ (pas de cash mais prêt)
    const isFinancedByLoan = displayCost === 0 && displayEcoPtz > 0;

    // Calculate bar widths relative to the larger value
    const maxValue = Math.max(displayCost, displayValueGain);
    const costPercent = maxValue > 0 ? (displayCost / maxValue) * 100 : 0;
    const gainPercent = maxValue > 0 ? (displayValueGain / maxValue) * 100 : 0;

    // Net balance
    const netBalance = displayValueGain - displayCost;
    const isPositive = netBalance >= 0;

    return (
        <div className="card-bento p-6 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <h3 className="text-lg font-semibold text-main mb-6 flex items-center gap-2">
                <span className="text-xl">⚖️</span> Coût vs Plus-Value
            </h3>

            <div className="space-y-4">
                {/* Cost Bar */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted">Dépense {isMaPoche && '(votre part)'}</span>
                        <span className="text-sm font-bold text-danger-500 tabular-nums">
                            {formatCurrency(displayCost)}
                        </span>
                    </div>
                    {displayCost > 0 ? (
                        <div className="h-6 bg-surface rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-danger-600 to-danger-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${costPercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    ) : (
                        <div className="h-6 bg-success-900/30 rounded-full border border-success-500/40 flex items-center px-3">
                            <span className="text-xs text-success-400 font-medium">
                                {isFinancedByLoan
                                    ? `0€ d'apport — Prêt Éco-PTZ ${formatCurrency(displayEcoPtz)}`
                                    : "0€ (Entièrement subventionné)"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Value Gain Bar */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted">Gain Patrimonial {isMaPoche && '(votre part)'}</span>
                        <span className="text-sm font-bold text-success-500 tabular-nums">
                            +{formatCurrency(displayValueGain)}
                        </span>
                    </div>
                    <div className="h-6 bg-surface rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-success-600 to-success-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${gainPercent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        />
                    </div>
                </div>
            </div>

            {/* Net Balance */}
            <div className={`mt-6 p-4 rounded-xl border ${isPositive ? 'bg-success-900/20 border-success-500/30' : 'bg-danger-900/20 border-danger-500/30'}`}>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-main">
                        {isPositive ? '📈 Solde net positif' : '📉 Solde net à financer'}
                    </span>
                    <span className={`text-xl font-bold tabular-nums ${isPositive ? 'text-success-400' : 'text-danger-400'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(netBalance)}
                    </span>
                </div>
                {isPositive && displayCost === 0 && !isFinancedByLoan && (
                    <p className="text-xs text-success-400/80 mt-2">
                        Entièrement couvert par les aides publiques
                    </p>
                )}
                {isFinancedByLoan && displayMonthly > 0 && (
                    <p className="text-xs text-muted mt-2">
                        Mensualité Éco-PTZ (20 ans, 0%) : <span className="text-main font-medium">{formatCurrency(displayMonthly)}/mois</span>
                    </p>
                )}
            </div>

            {/* Disclaimer transparence - AUDIT 31/01/2026 */}
            {isFinancedByLoan && (
                <div className="mt-4 p-3 bg-surface-highlight/50 rounded-lg border border-boundary/30">
                    <p className="text-[10px] text-muted leading-relaxed">
                        <span className="font-semibold text-warning-400">Note :</span> L&apos;Éco-PTZ est un prêt à taux zéro, pas une aide à fonds perdus.
                        Le capital emprunté doit être remboursé sur 20 ans. Aucun intérêt ne vous sera facturé.
                    </p>
                </div>
            )}
        </div>
    );
}
