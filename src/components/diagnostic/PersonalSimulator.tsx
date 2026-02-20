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

export default function PersonalSimulator({ result }: { result: DiagnosticResult }) {
    const [tantiemes, setTantiemes] = useState(100);
    const [totalTantiemes, setTotalTantiemes] = useState(1000);
    const [investorType, setInvestorType] = useState<InvestorType>("occupant");
    const [tmi, setTmi] = useState<TmiBracket>(0.30);
    const [fiscalRegime, setFiscalRegime] = useState<FiscalRegime>("reel");

    // ── Nouveaux states 2026 ─────────────────────────────────────────────────
    const [codePostal, setCodePostal] = useState(result.input.codePostalImmeuble ?? "");
    const [rfr, setRfr] = useState(0);           // Revenu Fiscal de Référence (bailleur ou occupant)
    const [revenusFonciers, setRevenusFonciers] = useState(
        result.input.revenusFonciersExistants ?? 0
    );
    const [optionLocAvantages, setOptionLocAvantages] = useState(
        result.input.optionLocAvantages ?? false
    );

    const personal = useMemo(() => {
        const ratio = totalTantiemes > 0 ? tantiemes / totalTantiemes : 0;
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
        const monthlyPayment = financing.monthlyPayment * ratio;
        const greenValue = valuation.greenValueGain * ratio;
        const monthlySavings = financing.monthlyEnergySavings * ratio;
        const netCashflow = financing.netMonthlyCashFlow * ratio;

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
    }, [tantiemes, totalTantiemes, result, tmi, fiscalRegime, revenusFonciers, investorType, codePostal, rfr, optionLocAvantages]);

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
        <section className="border border-brass/30 bg-slate-50/60 rounded-xl mt-6 px-6 py-8 md:px-8 shadow-sm">

            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-brass-dark to-brass rounded-full" />
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
                    Tantièmes et clés de répartition peuvent différer selon la nature des travaux.
                </p>
            </div>

            {/* ── Controls ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 mb-8 flex-wrap">

                {/* Tantièmes Input Group */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label
                            htmlFor="tantiemes"
                            className="block text-[10px] font-bold uppercase tracking-[0.08em] text-slate mb-2"
                        >
                            Vos tantièmes
                        </label>
                        <input
                            id="tantiemes"
                            type="number"
                            min={1}
                            className={inputCls}
                            value={tantiemes || ""}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                setTantiemes(isNaN(v) ? 0 : v);
                            }}
                        />
                    </div>
                    <div className="flex-1">
                        <label
                            htmlFor="totalTantiemes"
                            className="block text-[10px] font-bold uppercase tracking-[0.08em] text-slate mb-2"
                        >
                            Total copro
                        </label>
                        <div className="relative">
                            <input
                                id="totalTantiemes"
                                type="number"
                                min={1}
                                className={inputCls}
                                value={totalTantiemes || ""}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    setTotalTantiemes(isNaN(v) ? 0 : v);
                                }}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-[10px] font-semibold text-slate-400">
                                    {(personal.ratio * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Investor Type Toggle */}
                <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-slate mb-2">
                        Statut du lot
                    </span>
                    <div className="flex p-1 bg-slate-100 rounded-md border border-slate-200 gap-1">
                        <button
                            type="button"
                            onClick={() => setInvestorType("occupant")}
                            className={`flex-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wide rounded transition-all duration-300 ${investorType === "occupant"
                                ? "bg-white text-brass-dark shadow-sm ring-1 ring-border"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/70"
                                }`}
                        >
                            Occupant
                        </button>
                        <button
                            type="button"
                            onClick={() => setInvestorType("bailleur")}
                            className={`flex-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wide rounded transition-all duration-300 ${investorType === "bailleur"
                                ? "bg-gradient-to-r from-brass-dark to-brass text-white shadow-sm ring-1 ring-brass-dark/50"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/70"
                                }`}
                        >
                            Bailleur
                        </button>
                    </div>
                </div>

                {/* Code Postal — géo-routage ANAH */}
                <div>
                    <label
                        htmlFor="codePostal-sim"
                        className="block text-[10px] font-semibold uppercase tracking-[0.05em] text-slate mb-1.5"
                    >
                        Code postal
                        <span className="ml-1 normal-case font-normal text-subtle">(barème ANAH)</span>
                    </label>
                    <input
                        id="codePostal-sim"
                        type="text"
                        maxLength={5}
                        pattern="\d{5}"
                        placeholder="ex: 75014"
                        className={`${inputCls} w-28`}
                        value={codePostal}
                        onChange={(e) => setCodePostal(e.target.value.replace(/\D/g, ""))}
                    />
                </div>
            </div>

            {/* ── ANAH Prime Info Banner (si code postal saisi) ── */}
            {codePostal.length === 5 && (
                <div className={`flex items-center gap-2 rounded-md border px-3.5 py-2 mb-5 text-[10px] ${isIDF(codePostal)
                    ? "border-navy/20 bg-navy/5 text-navy/80"
                    : "border-moss/20 bg-moss/5 text-moss/80"
                    }`}>
                    <span className="font-semibold">
                        Barème {isIDF(codePostal) ? "Île-de-France" : "Province"} appliqué
                    </span>
                    <span className="text-subtle">— Saisissez votre RFR N−1 pour voir votre prime individuelle</span>
                </div>
            )}

            {/* ── Results Grid ────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

                {/* Card 1 : Reste au comptant */}
                <div className="flex flex-col items-center justify-between p-6 min-h-[120px] rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brass-dark to-brass-light opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate mb-3 mt-1">
                        Reste au comptant
                    </span>
                    <span className="text-3xl font-serif font-bold text-oxford tabular-nums">
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
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brass-dark to-brass-light opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate mb-3 mt-1">
                        Mensualité Éco-PTZ
                    </span>
                    <span className="text-3xl font-serif font-bold text-oxford tabular-nums">
                        {formatCurrency(personal.monthlyPayment)}
                    </span>
                    <span className="text-[10px] text-subtle mt-auto pt-3">/ mois pendant 20 ans</span>
                </div>

                {/* Card 3: Potentiel de Valorisation Patrimoniale */}
                <div className="flex flex-col items-center justify-between p-6 min-h-[120px] rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 text-center relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brass-dark to-brass-light opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate mb-3 mt-1">
                        Valeur Verte
                    </span>
                    <span className="text-3xl font-serif font-bold text-gain tabular-nums">
                        + {formatCurrency(personal.greenValue)}
                    </span>
                    <span className="text-[10px] text-subtle mt-auto pt-3">Valorisation patrimoniale estimée</span>
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

            {/* ── Bailleur: Primes & Déficit Foncier Block ─── */}
            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${investorType === "bailleur" ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="rounded-card bg-brass-muted border border-brass/15 p-5 space-y-5">

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
                                        placeholder="ex: 20000"
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
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-slate">{label}</span>
            <span className={`text-sm font-semibold tabular-nums ${green ? "text-gain" : "text-oxford"}`}>
                {value}
            </span>
        </div>
    );
}
