"use client";

/**
 * VALO-SYNDIC — PersonalSimulator
 * ================================
 * Tantièmes-based individual cost simulator.
 * "Combien ça me coûte MOI ?" — The AG closing tool.
 */

import { useState, useMemo } from "react";
import type { DiagnosticResult } from "@/lib/schemas";
import { formatCurrency } from "@/lib/calculator";
import { FINANCES_2026 } from "@/lib/financialConstants";

type InvestorType = "occupant" | "bailleur";

export default function PersonalSimulator({ result }: { result: DiagnosticResult }) {
    const [tantiemes, setTantiemes] = useState(100);
    const [totalTantiemes, setTotalTantiemes] = useState(1000);
    const [investorType, setInvestorType] = useState<InvestorType>("occupant");

    const personal = useMemo(() => {
        const ratio = totalTantiemes > 0 ? tantiemes / totalTantiemes : 0;
        const { financing, valuation } = result;

        const totalTTC = financing.totalCostTTC * ratio;
        const subsidies = (financing.mprAmount + financing.ceeAmount + financing.localAidAmount + financing.amoAmount) * ratio;
        const loanAmount = financing.ecoPtzAmount * ratio;
        const cashDown = Math.max(0, financing.remainingCost * ratio - loanAmount);
        const racBrut = financing.remainingCost * ratio;
        const monthlyPayment = financing.monthlyPayment * ratio;
        const greenValue = valuation.greenValueGain * ratio;
        const monthlySavings = financing.monthlyEnergySavings * ratio;
        const netCashflow = financing.netMonthlyCashFlow * ratio;

        // Déficit Foncier: assiette = RAC comptant (cash réellement décaissé)
        const deficitFoncier = cashDown * FINANCES_2026.DEFICIT_FONCIER.TAUX_EFFECTIF;

        return {
            ratio,
            totalTTC,
            subsidies,
            loanAmount,
            racBrut,
            cashDown,
            monthlyPayment,
            greenValue,
            monthlySavings,
            netCashflow,
            deficitFoncier,
        };
    }, [tantiemes, totalTantiemes, result]);

    const inputCls =
        "w-full h-10 px-3 text-sm text-oxford bg-white border border-border rounded-md " +
        "placeholder:text-subtle/60 " +
        "hover:border-border-strong " +
        "focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 " +
        "transition-colors duration-150 tabular-nums text-center";

    return (
        <section className="border-t-2 border-brass bg-slate-50/60 rounded-b-card -mx-6 -mb-6 md:-mx-8 md:-mb-8 px-6 py-8 md:px-8">

            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-5 bg-brass rounded-full" />
                <h3 className="font-serif text-lg font-semibold text-oxford">
                    Bilan Patrimonial Personnel
                </h3>
            </div>

            {/* ── Controls ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-8">

                {/* Tantièmes Input Group */}
                <div className="flex items-end gap-2">
                    <div>
                        <label
                            htmlFor="tantiemes"
                            className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-1"
                        >
                            Tantièmes
                        </label>
                        <input
                            id="tantiemes"
                            type="number"
                            min={1}
                            className={`${inputCls} w-20`}
                            value={tantiemes || ""}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                setTantiemes(isNaN(v) ? 0 : v);
                            }}
                        />
                    </div>
                    <span className="text-slate text-lg font-light pb-1.5">/</span>
                    <div>
                        <label
                            htmlFor="totalTantiemes"
                            className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-1"
                        >
                            Total
                        </label>
                        <input
                            id="totalTantiemes"
                            type="number"
                            min={1}
                            className={`${inputCls} w-20`}
                            value={totalTantiemes || ""}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                setTotalTantiemes(isNaN(v) ? 0 : v);
                            }}
                        />
                    </div>
                    <span className="text-[10px] text-subtle pb-2.5">
                        ({(personal.ratio * 100).toFixed(1)}%)
                    </span>
                </div>

                {/* Investor Type Toggle */}
                <div className="flex rounded-md border border-border overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setInvestorType("occupant")}
                        className={`px-4 py-2 text-xs font-semibold transition-colors duration-150 ${investorType === "occupant"
                                ? "bg-navy text-white"
                                : "bg-white text-slate hover:bg-slate-50"
                            }`}
                    >
                        Propriétaire Occupant
                    </button>
                    <button
                        type="button"
                        onClick={() => setInvestorType("bailleur")}
                        className={`px-4 py-2 text-xs font-semibold border-l border-border transition-colors duration-150 ${investorType === "bailleur"
                                ? "bg-navy text-white"
                                : "bg-white text-slate hover:bg-slate-50"
                            }`}
                    >
                        Propriétaire Bailleur
                    </button>
                </div>
            </div>

            {/* ── Results Grid ────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

                {/* Card 1: Reste au comptant */}
                <div className="flex flex-col items-center justify-center p-5 rounded-card bg-white border border-border text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-2">
                        Reste au comptant
                    </span>
                    <span className="text-2xl md:text-3xl font-serif font-bold text-oxford tabular-nums">
                        {formatCurrency(personal.cashDown)}
                    </span>
                    <span className="text-[10px] text-subtle mt-1">à régler immédiatement</span>
                </div>

                {/* Card 2: Mensualité Éco-PTZ */}
                <div className="flex flex-col items-center justify-center p-5 rounded-card bg-white border border-border text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-2">
                        Mensualité Éco-PTZ
                    </span>
                    <span className="text-2xl md:text-3xl font-serif font-bold text-oxford tabular-nums">
                        {formatCurrency(personal.monthlyPayment)}
                    </span>
                    <span className="text-[10px] text-subtle mt-1">/ mois pendant 20 ans</span>
                </div>

                {/* Card 3: Gain Valeur Verte */}
                <div className="flex flex-col items-center justify-center p-5 rounded-card bg-white border border-border text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-2">
                        Gain Valeur Verte
                    </span>
                    <span className="text-2xl md:text-3xl font-serif font-bold text-gain tabular-nums">
                        + {formatCurrency(personal.greenValue)}
                    </span>
                    <span className="text-[10px] text-subtle mt-1">plus-value estimée</span>
                </div>
            </div>

            {/* ── Summary Line Items ─────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mb-6 px-1">
                <MiniStat label="Coût TTC" value={formatCurrency(personal.totalTTC)} />
                <MiniStat label="Total Aides" value={`− ${formatCurrency(personal.subsidies)}`} green />
                <MiniStat label="Éco-PTZ" value={formatCurrency(personal.loanAmount)} />
                <MiniStat label="Éco. énergie / mois" value={`+ ${formatCurrency(personal.monthlySavings)}`} green />
            </div>

            {/* ── Bailleur: Déficit Foncier Block ─────────────── */}
            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${investorType === "bailleur" ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="rounded-card bg-brass-muted border border-brass/15 p-5">
                    <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                        <div>
                            <h4 className="text-sm font-semibold text-oxford">
                                Avantage Fiscal — Déficit Foncier Année 1
                            </h4>
                            <p className="text-[10px] text-slate mt-1 leading-relaxed max-w-md">
                                Déduction estimée sur vos revenus fonciers (TMI 30% + PS 17.2% = 47.2%).
                                Assiette : RAC comptant uniquement. Reportable sur 10 ans.
                            </p>
                        </div>
                        <span className="text-2xl font-serif font-bold text-brass-dark tabular-nums whitespace-nowrap">
                            − {formatCurrency(personal.deficitFoncier)}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Mini stat helper ─────────────────────────────────────────────────────────
function MiniStat({ label, value, green }: { label: string; value: string; green?: boolean }) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-subtle">{label}</span>
            <span className={`text-sm font-semibold tabular-nums ${green ? "text-gain" : "text-oxford"}`}>
                {value}
            </span>
        </div>
    );
}
