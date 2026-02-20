"use client";

/**
 * VALO-SYNDIC — PersonalSimulator
 * ================================
 * Simulateur individuel : "Combien ça me coûte MOI ?"
 *
 * Conformité Loi 65 — Art. 10 : disclaimer répartition légale obligatoire.
 * Bailleur : TMI sélectionnable (11/30/41/45%) + toggle régime Micro-Foncier / Réel.
 * Sémantique de conseil : termes estimatifs, pas affirmatifs de rendement.
 */

import { useState, useMemo } from "react";
import { Info } from "lucide-react";
import type { DiagnosticResult } from "@/lib/schemas";
import { formatCurrency } from "@/lib/calculator";
import { FINANCES_2026, type TmiBracket } from "@/lib/financialConstants";

type InvestorType = "occupant" | "bailleur";
type FiscalRegime = "micro" | "reel";

const PS = FINANCES_2026.DEFICIT_FONCIER.PRELEVEMENT_SOCIAUX; // 17.2%

export default function PersonalSimulator({ result }: { result: DiagnosticResult }) {
    const [tantiemes, setTantiemes] = useState(100);
    const [totalTantiemes, setTotalTantiemes] = useState(1000);
    const [investorType, setInvestorType] = useState<InvestorType>("occupant");
    const [tmi, setTmi] = useState<TmiBracket>(0.30);
    const [fiscalRegime, setFiscalRegime] = useState<FiscalRegime>("reel");

    const personal = useMemo(() => {
        const ratio = totalTantiemes > 0 ? tantiemes / totalTantiemes : 0;
        const { financing, valuation } = result;

        const totalTTC = financing.totalCostTTC * ratio;
        const subsidies = (financing.mprAmount + financing.ceeAmount + financing.localAidAmount + financing.amoAmount) * ratio;
        const loanAmount = financing.ecoPtzAmount * ratio;
        const racBrut = financing.remainingCost * ratio;
        const cashDown = Math.max(0, racBrut - loanAmount);
        const monthlyPayment = financing.monthlyPayment * ratio;
        const greenValue = valuation.greenValueGain * ratio;
        const monthlySavings = financing.monthlyEnergySavings * ratio;
        const netCashflow = financing.netMonthlyCashFlow * ratio;

        // FIX AUDIT FEV 2026 : Déficit Foncier — CGI Art. 31 & 156
        // L'assiette déductible = montant total des travaux payés à l'entreprise,
        // QUELLE QUE SOIT l'origine des fonds (emprunt Éco-PTZ ou cash).
        // L'erreur précédente limitait à cashDown uniquement, pénalisant à tort
        // les investisseurs emprunteurs et incitant au paiement comptant. (Défaut de conseil)
        // Assiette retenue : RAC brut (quote-part travaux nets de subventions),
        // emprunt inclus. Déduction reportable 10 ans (Art. 156 I-3° CGI).
        const assietteDeficitFoncier = fiscalRegime === "reel" ? racBrut : 0;
        const deficitFoncier = assietteDeficitFoncier * (tmi + PS);

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
    }, [tantiemes, totalTantiemes, result, tmi, fiscalRegime]);

    const inputCls =
        "w-full h-10 px-3 text-sm text-oxford bg-white border border-border rounded-md " +
        "placeholder:text-subtle/60 " +
        "hover:border-border-strong " +
        "focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 " +
        "transition-colors duration-150 tabular-nums text-center";

    const selectCls =
        "h-9 px-2.5 text-xs text-oxford bg-white border border-border rounded-md " +
        "hover:border-border-strong " +
        "focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 " +
        "transition-colors duration-150 cursor-pointer";

    return (
        <section className="border-t-2 border-brass bg-slate-50/60 rounded-b-card -mx-6 -mb-6 md:-mx-8 md:-mb-8 px-6 py-8 md:px-8">

            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-brass rounded-full" />
                <h3 className="font-serif text-lg font-semibold text-oxford">
                    Bilan Patrimonial Personnel
                </h3>
            </div>

            {/* ── Disclaimer Art. 10 Loi 65 ───────────────────── */}
            <div className="flex items-start gap-2 rounded-md border border-navy/15 bg-navy/5 px-3.5 py-2.5 mb-6">
                <Info className="w-3 h-3 text-navy flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-navy/80 leading-relaxed">
                    <strong>Calcul estimatif lissé.</strong> La répartition légale exacte sera appliquée selon les grilles
                    de votre Règlement de Copropriété{" "}
                    <strong>(Art. 10 Loi 65 : Charges générales vs Utilité)</strong>.
                    Tantièmes et clés de répartition peuvent différer selon la nature des travaux.
                </p>
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
                            Vos tantièmes
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
                            Total copro
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
                    <span className="text-[10px] text-subtle mt-1">appel de fonds immédiat</span>
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

                {/* Card 3: Potentiel de Valorisation Patrimoniale */}
                <div className="flex flex-col items-center justify-center p-5 rounded-card bg-white border border-border text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-2">
                        Potentiel Valeur Verte
                    </span>
                    <span className="text-2xl md:text-3xl font-serif font-bold text-gain tabular-nums">
                        + {formatCurrency(personal.greenValue)}
                    </span>
                    <span className="text-[10px] text-subtle mt-1">potentiel de valorisation patrimoniale (est. marché)</span>
                </div>
            </div>

            {/* ── Summary Line Items ─────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mb-6 px-1">
                <MiniStat label="Coût TTC" value={formatCurrency(personal.totalTTC)} />
                <MiniStat label="Total Aides" value={`− ${formatCurrency(personal.subsidies)}`} green />
                <MiniStat label="Éco-PTZ" value={formatCurrency(personal.loanAmount)} />
                <MiniStat
                    label="Éco. énergie théorique / mois"
                    value={`+ ${formatCurrency(personal.monthlySavings)}`}
                    green
                />
            </div>

            {/* ── Bailleur: Déficit Foncier Block ─────────────── */}
            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${investorType === "bailleur" ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="rounded-card bg-brass-muted border border-brass/15 p-5 space-y-4">

                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-oxford">
                            Avantage Fiscal — Régime Réel / Déficit Foncier
                        </h4>
                    </div>

                    {/* Fiscal Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">

                        {/* TMI Selector */}
                        <div>
                            <label
                                htmlFor="tmi-select"
                                className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-1"
                            >
                                Tranche d&rsquo;imposition (TMI)
                            </label>
                            <select
                                id="tmi-select"
                                className={selectCls}
                                value={tmi}
                                onChange={(e) => setTmi(parseFloat(e.target.value) as TmiBracket)}
                            >
                                {FINANCES_2026.DEFICIT_FONCIER.TMI_BRACKETS.map((t) => (
                                    <option key={t} value={t}>
                                        {Math.round(t * 100)}%
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Régime Fiscal Toggle */}
                        <div>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-1">
                                Régime fiscal
                            </span>
                            <div className="flex rounded-md border border-border overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setFiscalRegime("reel")}
                                    className={`px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 ${fiscalRegime === "reel"
                                        ? "bg-navy text-white"
                                        : "bg-white text-slate hover:bg-slate-50"
                                        }`}
                                >
                                    Réel (Déficit Foncier)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFiscalRegime("micro")}
                                    className={`px-3 py-1.5 text-[11px] font-semibold border-l border-border transition-colors duration-150 ${fiscalRegime === "micro"
                                        ? "bg-navy text-white"
                                        : "bg-white text-slate hover:bg-slate-50"
                                        }`}
                                >
                                    Micro-Foncier (30%)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Résultat fiscal */}
                    {fiscalRegime === "reel" ? (
                        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                            <p className="text-[10px] text-slate leading-relaxed max-w-md">
                                Déduction estimée sur vos revenus fonciers ({Math.round(tmi * 100)}% TMI + 17,2% PS = {((tmi + PS) * 100).toFixed(1)}%).
                                Assiette : RAC comptant uniquement (Art. 156 CGI). Reportable sur 10 ans.
                            </p>
                            <span className="text-2xl font-serif font-bold text-brass-dark tabular-nums whitespace-nowrap">
                                − {formatCurrency(personal.deficitFoncier)}
                            </span>
                        </div>
                    ) : (
                        <div className="rounded-md border border-navy/10 bg-white/60 px-3.5 py-3">
                            <p className="text-[10px] text-slate leading-relaxed">
                                En régime <strong>Micro-Foncier</strong>, l&rsquo;abattement forfaitaire de 30% s&rsquo;applique
                                sur l&rsquo;ensemble des revenus fonciers bruts — mais ne permet pas de déduire spécifiquement
                                les charges de travaux. Le calcul du gain fiscal au titre du Déficit Foncier{" "}
                                <strong>n&rsquo;est pas applicable dans ce régime.</strong>{" "}
                                Consultez votre conseiller fiscal pour évaluer l&rsquo;opportunité d&rsquo;opter pour le régime Réel.
                            </p>
                        </div>
                    )}
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
