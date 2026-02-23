"use client";

/**
 * VALO-SYNDIC — PersonalSimulator
 * ================================
 * Simulateur individuel : "Combien ça me coûte MOI ?"
 *
 * Conformité Loi 65 — Art. 10 : disclaimer répartition légale obligatoire.
 * Bailleur : TMI sélectionnable (11/30/41/45%) + toggle régime Micro-Foncier / Réel.
 * Sémantique de conseil : termes estimatifs, pas affirmatifs de rendement.
 *
 * MISE À JOUR 2026 :
 *   - Géo-routage barème ANAH IDF vs Province par code postal
 *   - Filtre statut lot bailleur/occupant sur primes individuelles (Loi 65 Art. 18-1 A)
 *   - Unlock primes bailleur via optionLocAvantages
 *   - Prise en compte revenus fonciers existants pour économie fiscale (TMI + PS)
 */

import { useState, useMemo } from "react";
import { Info } from "lucide-react";
import type { DiagnosticResult } from "@/lib/schemas";
import { formatCurrency } from "@/lib/calculator";
import {
    FINANCES_2026,
    BAREME_ANAH_2026_IDF,
    BAREME_ANAH_2026_PROVINCE,
    type TmiBracket,
} from "@/lib/financialConstants";

type InvestorType = "occupant" | "bailleur";
type FiscalRegime = "micro" | "reel";

const PS = FINANCES_2026.DEFICIT_FONCIER.PRELEVEMENT_SOCIAUX; // 17.2%

/** Préfixes de codes postaux IDF (75, 77, 78, 91–95) */
const IDF_PREFIXES = ["75", "77", "78", "91", "92", "93", "94", "95"] as const;

/** Détermine si un code postal est en Île-de-France */
function isIDF(cp: string): boolean {
    return IDF_PREFIXES.some((p) => cp.startsWith(p));
}

/**
 * Retourne la prime individuelle ANAH selon le barème géographique.
 * Simplifié sur 1 personne / foyer 1 UC (proxy conservateur).
 * RFR 0 = pas de données → on retourne 0 par précaution.
 */
function getPrimeANAH(codePostal: string, rfr: number): number {
    if (!rfr || rfr <= 0) return 0;
    const bareme = isIDF(codePostal) ? BAREME_ANAH_2026_IDF : BAREME_ANAH_2026_PROVINCE;
    // Seuils 1 personne (index 0 du tableau base)
    const seuilBleu = bareme.bleu.base[0];
    const seuilJaune = bareme.jaune.base[0];
    if (rfr <= seuilBleu) return FINANCES_2026.MPR_PRIMES_INDIVIDUELLES.BLEU;   // 3 000 €
    if (rfr <= seuilJaune) return FINANCES_2026.MPR_PRIMES_INDIVIDUELLES.JAUNE; // 1 500 €
    return 0;
}

const TYPOLOGY_MULTIPLIERS = {
    Studio: 0.5,
    T2: 0.75,
    T3: 1.0,
    T4: 1.25,
    T5: 1.5,
};

export default function PersonalSimulator({ result }: { result: DiagnosticResult }) {
    const [tantiemes, setTantiemes] = useState(100);
    const [totalTantiemes, setTotalTantiemes] = useState(1000);
    const [investorType, setInvestorType] = useState<InvestorType>("occupant");
    const [tmi, setTmi] = useState<TmiBracket>(0.30);
    const [fiscalRegime, setFiscalRegime] = useState<FiscalRegime>("reel");

    // ── Nouveaux states 2026 ─────────────────────────────────────────────────
    const codePostal = result.input.codePostalImmeuble || "";
    const [rfr, setRfr] = useState(0);           // Revenu Fiscal de Référence (bailleur ou occupant)
    const [revenusFonciers, setRevenusFonciers] = useState(
        result.input.revenusFonciersExistants ?? 0
    );
    const [optionLocAvantages, setOptionLocAvantages] = useState(
        result.input.optionLocAvantages ?? false
    );
    const [shareMethod, setShareMethod] = useState<"tantiemes" | "typology">("tantiemes");
    const [typology, setTypology] = useState<"Studio" | "T2" | "T3" | "T4" | "T5">("T3");
    const [ptzDuration, setPtzDuration] = useState(result.input.ecoPtzDuration ?? 20);

    const personal = useMemo(() => {
        const avgTantiemes = totalTantiemes / Math.max(1, result.input.numberOfUnits);
        const computedTantiemes = shareMethod === "tantiemes" ? tantiemes : avgTantiemes * TYPOLOGY_MULTIPLIERS[typology];
        const ratio = totalTantiemes > 0 ? computedTantiemes / totalTantiemes : 0;
        const { financing, valuation } = result;

        const totalTTC = financing.totalCostTTC * ratio;
        const subsidies = (
            financing.mprAmount +
            financing.ceeAmount +
            financing.localAidAmount +
            financing.amoAmount
        ) * ratio;
        const loanAmount = financing.ecoPtzAmount * ratio;
        const racBrut = financing.remainingCost * ratio;
        const cashDown = Math.max(0, racBrut - loanAmount);

        // Recalculate monthly payment locally if PTZ duration changes
        const monthlyPayment = ptzDuration > 0 ? loanAmount / (ptzDuration * 12) : 0;

        const greenValue = valuation.greenValueGain * ratio;
        const monthlySavings = financing.monthlyEnergySavings * ratio;
        const netCashflow = monthlySavings - monthlyPayment;

        // ── Déficit Foncier — CGI Art. 31 & 156 ─────────────────────────────
        // Assiette = RAC brut (part travaux nets de subventions, emprunt inclus).
        // Avec revenus fonciers existants : TVA + PS sur la base élargie.
        const assietteDeficitFoncier = fiscalRegime === "reel" ? racBrut : 0;
        const economieSurRG = Math.min(assietteDeficitFoncier, 10700) * tmi;
        const rfExistants = Math.max(0, revenusFonciers * ratio);
        const excedent = Math.max(0, assietteDeficitFoncier - 10700);
        const economieSurRF = (excedent + rfExistants) * (tmi + PS);
        const deficitFoncier = economieSurRG + economieSurRF;

        // ── Primes ANAH individuelles (géo-routées) ─────────────────────────
        // Bloquées pour bailleurs sauf LocAvantages (Loi 65 Art. 18-1 A)
        const primesEligibles = investorType !== "bailleur" || optionLocAvantages;
        const primeANAH = primesEligibles && codePostal.length === 5
            ? getPrimeANAH(codePostal, rfr)
            : 0;
        const cashDownNet = Math.max(0, cashDown - primeANAH); // RAC ajusté de la prime

        return {
            ratio,
            totalTTC,
            subsidies,
            loanAmount,
            racBrut,
            cashDown,
            cashDownNet,
            monthlyPayment,
            greenValue,
            monthlySavings,
            netCashflow,
            deficitFoncier,
            primeANAH,
        };
    }, [tantiemes, totalTantiemes, result, tmi, fiscalRegime, revenusFonciers, investorType, codePostal, rfr, optionLocAvantages, shareMethod, typology, ptzDuration]);

    const inputCls =
        "w-full h-10 px-3 text-sm text-oxford bg-white border border-border rounded-md " +
        "placeholder:text-slate-400 " +
        "hover:border-border-strong " +
        "focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 " +
        "transition-colors duration-150 tabular-nums text-center";

    const selectCls =
        "h-9 px-2.5 text-xs text-oxford bg-white border border-border rounded-md " +
        "hover:border-border-strong " +
        "focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 " +
        "transition-colors duration-150 cursor-pointer";

    return (
        <section className="border border-border bg-white rounded-xl mt-6 px-6 py-8 md:px-8 shadow-sm">

            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-navy rounded-full" />
                <h3 className="font-serif text-lg font-bold text-oxford">
                    Bilan Patrimonial Personnel
                </h3>
            </div>

            {/* ── Disclaimer Art. 10 Loi 65 ───────────────────── */}
            <div className="flex items-start gap-2 rounded-md border border-navy/15 bg-navy/5 px-3.5 py-2.5 mb-6">
                <Info className="w-3.5 h-3.5 text-navy flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-navy/80 leading-relaxed font-medium">
                    <strong>Calcul estimatif lissé.</strong> La répartition légale exacte sera appliquée selon les grilles
                    de votre Règlement de Copropriété{" "}
                    <strong>(Art. 10 Loi 65 : Charges générales vs Utilité)</strong>.
                    Quote-part (tantièmes) et clés de répartition peuvent différer selon la nature des travaux.
                </p>
            </div>

            {/* ── Paramètres de calcul (Format expert) ──────────── */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 mb-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Mode & Quote-part */}
                    <div className="flex flex-col gap-3 lg:border-r lg:border-slate-200 lg:pr-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">
                                Quote-part
                            </span>
                            <div className="flex bg-slate-200/60 p-0.5 rounded">
                                <button
                                    type="button"
                                    onClick={() => setShareMethod("tantiemes")}
                                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${shareMethod === "tantiemes" ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Quote-part (tantièmes)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShareMethod("typology")}
                                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${shareMethod === "typology" ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Typologie
                                </button>
                            </div>
                        </div>
                        {shareMethod === "tantiemes" ? (
                            <div className="flex items-center gap-2">
                                <input
                                    id="tantiemes"
                                    type="number"
                                    min={1}
                                    placeholder="Votre quote-part"
                                    className={`${inputCls} h-9 text-xs flex-1`}
                                    value={tantiemes || ""}
                                    onChange={(e) => setTantiemes(parseInt(e.target.value) || 0)}
                                />
                                <span className="text-slate flex-shrink-0 text-xs">/</span>
                                <input
                                    id="totalTantiemes"
                                    type="number"
                                    min={1}
                                    placeholder="Total copro"
                                    className={`${inputCls} h-9 text-xs flex-1`}
                                    value={totalTantiemes || ""}
                                    onChange={(e) => setTotalTantiemes(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        ) : (
                            <select
                                id="typology"
                                className={`${selectCls} h-9 text-xs w-full`}
                                value={typology}
                                onChange={(e) => setTypology(e.target.value as any)}
                            >
                                <option value="Studio">Studio</option>
                                <option value="T2">T2</option>
                                <option value="T3">T3</option>
                                <option value="T4">T4</option>
                                <option value="T5">T5 (ou +)</option>
                            </select>
                        )}
                        <div className="text-[10px] font-semibold text-right text-navy bg-navy/5 py-1.5 px-2 rounded-md ml-auto mt-auto">
                            Quote-part : {(personal.ratio * 100).toFixed(1)}%
                        </div>
                    </div>

                    {/* Statut & Localisation */}
                    <div className="flex flex-col gap-3 lg:border-r lg:border-slate-200 lg:pr-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">
                                Statut & Localisation
                            </span>
                        </div>
                        <div className="flex bg-slate-200/60 p-0.5 rounded">
                            <button
                                type="button"
                                onClick={() => setInvestorType("occupant")}
                                className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${investorType === "occupant" ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Occupant
                            </button>
                            <button
                                type="button"
                                onClick={() => setInvestorType("bailleur")}
                                className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${investorType === "bailleur" ? "bg-navy text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                Bailleur
                            </button>
                        </div>

                    </div>

                    {/* Financement Éco-PTZ & ANAH Banner */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">
                                Emprunt Collectif
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="ptzDuration-sim" className="text-[10px] font-semibold text-slate whitespace-nowrap">Durée Éco-PTZ</label>
                            <div className="flex items-center gap-1 w-24 relative">
                                <input
                                    id="ptzDuration-sim"
                                    type="number"
                                    min={1}
                                    max={25}
                                    className={`${inputCls} h-9 text-xs w-full pl-2 pr-6 text-right`}
                                    value={ptzDuration || ""}
                                    onChange={(e) => setPtzDuration(parseInt(e.target.value) || 20)}
                                />
                                <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none">ans</span>
                            </div>
                        </div>
                        {codePostal.length === 5 && (
                            <div className={`mt-auto rounded-md border px-2.5 py-1.5 text-[9px] font-medium leading-tight ${isIDF(codePostal) ? "border-navy/20 bg-navy/5 text-navy/80" : "border-moss/20 bg-moss/5 text-moss/80"}`}>
                                <span className="font-bold">Barème {isIDF(codePostal) ? "IDF" : "Province"} appliqué</span> —
                                Saisissez votre RFR pour voir la prime.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Results Grid ────────────────────────────────── */}
            <div className={`grid grid-cols-1 gap-5 mb-8 ${investorType === "bailleur" ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>

                {/* Card 1 : Reste au comptant */}
                <div className="flex flex-col items-center justify-between p-6 min-h-[120px] rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1 bg-navy opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate mb-3 mt-1">
                        Reste au comptant
                    </span>
                    <span className="text-3xl font-serif font-bold text-oxford tabular-nums whitespace-nowrap">
                        {formatCurrency(personal.cashDown)}
                    </span>
                    {personal.primeANAH > 0 && (
                        <span className="text-[11px] font-medium text-gain mt-1.5">
                            − {formatCurrency(personal.primeANAH)} prime ANAH → {formatCurrency(personal.cashDownNet)}
                        </span>
                    )}
                    <span className="text-[10px] text-subtle mt-auto pt-3">Appel de fonds immédiat</span>
                </div>

                {/* Card 2: Mensualité Éco-PTZ */}
                <div className="flex flex-col items-center justify-between p-6 min-h-[120px] rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1 bg-navy opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate mb-3 mt-1">
                        Mensualité Éco-PTZ
                    </span>
                    <span className="text-3xl font-serif font-bold text-oxford tabular-nums whitespace-nowrap">
                        {formatCurrency(personal.monthlyPayment)}
                    </span>
                    <span className="text-[10px] text-subtle mt-auto pt-3">/ mois pendant {ptzDuration} ans</span>
                </div>

                {/* Card 3: Potentiel de Valorisation Patrimoniale */}
                <div className="flex flex-col items-center justify-between p-6 min-h-[120px] rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1 bg-navy opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate mb-3 mt-1">
                        Valeur Verte
                    </span>
                    <span className="text-3xl font-serif font-bold text-gain tabular-nums whitespace-nowrap">
                        + {formatCurrency(personal.greenValue)}
                    </span>
                    <div className="flex flex-col mt-auto pt-3 text-center">
                        <span className="text-[10px] text-subtle">Valorisation patrimoniale estimée</span>
                        <span className="text-[8px] text-slate-400 mt-1 italic leading-tight max-w-[140px]">
                            Basé sur une estimation moyenne de +{Math.round(result.valuation.greenValueGainPercent * 100)}% de valorisation après travaux.
                        </span>
                    </div>
                </div>

                {/* Item 4 — Carte KPI Économie d'impôt — uniquement si Bailleur */}
                {investorType === "bailleur" && (
                    <div className="flex flex-col items-center justify-between p-6 min-h-[120px] rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 text-center relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gain opacity-80 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate mb-3 mt-1 leading-tight">
                            Économie d&apos;impôt estimée
                            <br />
                            <span className="font-normal normal-case tracking-normal text-[9px] text-subtle">(Déficit Foncier – CGI art. 156)</span>
                        </span>
                        <span className="text-3xl font-serif font-bold text-gain tabular-nums whitespace-nowrap">
                            {fiscalRegime === "micro"
                                ? <span className="text-slate-400 text-lg">Non applicable (Micro)</span>
                                : personal.deficitFoncier > 0
                                    ? `+ ${formatCurrency(personal.deficitFoncier)}`
                                    : <span className="text-slate-400 text-xl">selon votre TMI</span>
                            }
                        </span>
                        <span className="text-[10px] text-subtle mt-auto pt-3">Gain fiscal Année 1 estimé</span>
                    </div>
                )}
            </div>

            {/* ── Summary Line Items (Ledger Style) ────────────────────── */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6 sm:gap-y-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
                    <MiniStat label="Coût TTC" value={formatCurrency(personal.totalTTC)} />
                    <MiniStat label="Total Aides" value={`− ${formatCurrency(personal.subsidies)}`} green />
                    <MiniStat label="Éco-PTZ" value={formatCurrency(personal.loanAmount)} />
                    <MiniStat
                        label="Éco. énergie théorique / mois"
                        value={`+ ${formatCurrency(personal.monthlySavings)}`}
                        green
                    />
                </div>
            </div>

            {/* Gain Fiscal explicit for Bailleur */}
            {investorType === "bailleur" && fiscalRegime === "reel" && (
                <div className="mb-6 flex items-center justify-between p-4 bg-gain-light/30 border border-gain/20 rounded-lg">
                    <span className="text-sm font-semibold text-oxford">Gain Fiscal estimé (Année 1)</span>
                    <span className="text-lg font-bold text-gain tabular-nums">+{formatCurrency(personal.deficitFoncier)}</span>
                </div>
            )}

            {/* ── Bailleur: Primes & Déficit Foncier Block ─── */}
            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${investorType === "bailleur" ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="rounded-card bg-slate-50 border border-slate-200 p-5 space-y-5">

                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-oxford">
                            Avantage Fiscal — Régime Réel / Déficit Foncier
                        </h4>
                    </div>

                    {/* ── Primes ANAH Bailleur ── */}
                    <div className="rounded-md border border-navy/10 bg-white/60 px-3.5 py-3 space-y-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate">
                            Primes ANAH individuelles — Loi 65 Art. 18-1 A
                        </p>

                        {/* LocAvantages toggle */}
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={optionLocAvantages}
                                onChange={(e) => setOptionLocAvantages(e.target.checked)}
                                className="h-4 w-4 rounded border-border text-navy focus:ring-navy/30"
                            />
                            <span className="text-[11px] text-oxford">
                                Conventionnement <strong>Loc&apos;Avantages</strong> (déverrouille les primes ANAH bailleur)
                            </span>
                        </label>

                        {!optionLocAvantages && (
                            <p className="text-[10px] text-slate/70 leading-relaxed">
                                En tant que bailleur sans conventionnement, les primes forfaitaires ANAH (Bleu 3 000 € / Jaune 1 500 €)
                                sont bloquées. Cochez Loc&apos;Avantages pour les débloquer.
                            </p>
                        )}

                        {optionLocAvantages && (
                            <div className="flex items-center gap-3">
                                <div>
                                    <label htmlFor="rfr-sim" className="block text-[10px] font-semibold text-slate mb-1">
                                        RFR N−1 ou N−2 (€/an)
                                    </label>
                                    <input
                                        id="rfr-sim"
                                        type="number"
                                        min={0}
                                        placeholder="20000"
                                        className={`${inputCls} w-32`}
                                        value={rfr || ""}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value);
                                            setRfr(isNaN(v) ? 0 : v);
                                        }}
                                    />
                                </div>
                                {personal.primeANAH > 0 ? (
                                    <div className="flex flex-col items-start pt-5">
                                        <span className="text-[10px] text-slate">Prime individuelle estimée</span>
                                        <span className="text-xl font-serif font-bold text-gain tabular-nums">
                                            − {formatCurrency(personal.primeANAH)}
                                        </span>
                                        <span className="text-[9px] text-subtle">
                                            Barème {isIDF(codePostal) ? "IDF" : "Province"} — profil {rfr <= (isIDF(codePostal) ? BAREME_ANAH_2026_IDF : BAREME_ANAH_2026_PROVINCE).bleu.base[0] ? "Bleu" : "Jaune"}
                                        </span>
                                    </div>
                                ) : (
                                    rfr > 0 && <p className="text-[10px] text-slate/70 pt-5">RFR supérieur aux plafonds ANAH → pas de prime individuelle.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Fiscal Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">

                        {/* TMI Selector */}
                        <div>
                            <label
                                htmlFor="tmi-select"
                                className="block text-[10px] font-semibold uppercase tracking-[0.05em] text-slate mb-1.5"
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
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.05em] text-slate mb-1.5">
                                Régime fiscal
                            </span>
                            <div className="flex p-0.5 bg-slate-100 rounded-md border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setFiscalRegime("reel")}
                                    className={`px-3 py-1.5 text-[11px] font-semibold rounded transition-all duration-150 ${fiscalRegime === "reel"
                                        ? "bg-white text-navy shadow-sm ring-1 ring-black/5"
                                        : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    Réel (Déficit Foncier)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFiscalRegime("micro")}
                                    className={`px-3 py-1.5 text-[11px] font-semibold rounded transition-all duration-150 ${fiscalRegime === "micro"
                                        ? "bg-white text-navy shadow-sm ring-1 ring-black/5"
                                        : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    Micro-Foncier (30%)
                                </button>
                            </div>
                        </div>

                        {/* Revenus Fonciers Existants — uniquement régime réel */}
                        {fiscalRegime === "reel" && (
                            <div>
                                <label
                                    htmlFor="rfExistants-sim"
                                    className="block text-[10px] font-semibold uppercase tracking-[0.05em] text-slate mb-1.5"
                                >
                                    Revenus fonciers N−1 (€/an)
                                </label>
                                <input
                                    id="rfExistants-sim"
                                    type="number"
                                    min={0}
                                    placeholder="ex: 12000"
                                    className={`${inputCls} w-32`}
                                    value={revenusFonciers || ""}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value);
                                        setRevenusFonciers(isNaN(v) ? 0 : v);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Résultat fiscal */}
                    {fiscalRegime === "reel" ? (
                        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                            <p className="text-[10px] text-slate leading-relaxed max-w-md">
                                Déduction estimée sur vos revenus fonciers ({Math.round(tmi * 100)}% TMI + 17,2% PS = {((tmi + PS) * 100).toFixed(1)}%).
                                Assiette : RAC brut — quote-part travaux nets de subventions, emprunt inclus (Art. 156 CGI).
                                {revenusFonciers > 0 && " Revenus fonciers existants inclus dans la base de calcul PS."}
                                {" "}Reportable sur 10 ans.
                            </p>
                            <span className="text-2xl font-serif font-bold text-navy tabular-nums whitespace-nowrap">
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
            {/* ── PAR+ — Prêt Avance Mutation (Profils Bleu & Jaune) ─────────────── */}
            {personal.primeANAH > 0 && (
                <div className="mt-6 rounded-xl border border-navy/15 bg-navy/3 p-5">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-navy">0%</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-oxford leading-tight">
                                Prêt Avance Mutation (PAR+)
                            </h4>
                            <p className="text-[10px] text-slate mt-0.5 leading-relaxed">
                                Prêt hypothécaire à <strong>taux 0 % / 10 ans</strong>, remboursable in fine
                                (vente ou succession). Levier alternatif pour financer le reste au comptant
                                sans décaissement immédiat — <strong>parties privatives uniquement</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Grille des plafonds */}
                    <div className="bg-white/70 rounded-lg border border-slate-200/70 overflow-hidden mb-3">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="border-b border-slate-200/70 bg-slate-50/80">
                                    <th className="text-left px-3 py-2 font-bold uppercase tracking-[0.07em] text-slate">
                                        Nature des travaux
                                    </th>
                                    <th className="text-right px-3 py-2 font-bold uppercase tracking-[0.07em] text-slate">
                                        Plafond PAR+
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="px-3 py-1.5 text-oxford">1 action parois vitrées uniquement</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums text-oxford">7 000 €</td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-1.5 text-oxford">1 geste d&apos;isolation autre</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums text-oxford">15 000 €</td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-1.5 text-oxford">Bouquet ≥ 2 gestes</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums text-oxford">25 000 €</td>
                                </tr>
                                <tr className="bg-navy/3">
                                    <td className="px-3 py-1.5 font-semibold text-navy">Rénovation globale</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums font-bold text-navy">50 000 €</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Conditions & non-cumul */}
                    <div className="flex flex-col sm:flex-row gap-2 text-[9.5px] leading-relaxed">
                        <div className="flex-1 rounded-md border border-slate-200/70 bg-white/60 px-3 py-2">
                            <span className="font-bold text-slate uppercase tracking-[0.06em]">Conditions</span>
                            <p className="text-slate/80 mt-1">
                                Revenus modestes ou très modestes (barèmes ANAH 2026) ·
                                Résidence principale &gt; 2 ans · 1 seul PAR+ par logement.
                            </p>
                        </div>
                        <div className="flex-1 rounded-md border border-amber-200/70 bg-amber-50/60 px-3 py-2">
                            <span className="font-bold text-amber-700 uppercase tracking-[0.06em]">⚠ Non-cumul</span>
                            <p className="text-amber-700/80 mt-1">
                                Incompatible avec l&apos;éco-PTZ sur les mêmes postes de travaux.
                                Cumulable avec MaPrimeRénov&apos;.
                            </p>
                        </div>
                    </div>

                    <p className="text-[9px] text-slate/50 mt-3 leading-relaxed">
                        Sources : service-public.gouv.fr/F38425 (màj 01/01/2026) · Décret n°2024-887 du 03/09/2024
                        · Arrêté du 10/12/2025 · Code consommation art. L315-1 à L315-23
                    </p>
                </div>
            )}
        </section>
    );
}

// ── Mini stat helper ─────────────────────────────────────────────────────────
function MiniStat({ label, value, green }: { label: string; value: string; green?: boolean }) {
    return (
        <div className="flex flex-col justify-between h-full px-2 sm:pl-4 sm:first:pl-0 sm:last:pr-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate leading-tight mb-2">{label}</span>
            <span className={`text-xl font-serif font-bold tabular-nums whitespace-nowrap ${green ? "text-gain" : "text-oxford"}`}>
                {value}
            </span>
        </div>
    );
}
