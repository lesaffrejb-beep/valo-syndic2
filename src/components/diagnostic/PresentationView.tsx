"use client";

/**
 * VALO-SYNDIC — PresentationView
 * ===============================
 * Full-screen projection view for General Assembly.
 * Massive serif typography, simplified layout, projector-optimized contrast.
 */

import { useDiagnosticStore } from "@/stores/useDiagnosticStore";
import { formatCurrency } from "@/lib/calculator";
import { FileText, AlertTriangle } from "lucide-react";
import ObjectionHandler from "@/components/diagnostic/ObjectionHandler";
import LegalNoticeModal from "@/components/ui/LegalNoticeModal";
import { useState } from "react";

export default function PresentationView() {
    const { result } = useDiagnosticStore();
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

    // ── Empty State ──────────────────────────────────────────
    if (!result) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-8">
                <FileText className="w-12 h-12 text-subtle mb-6" strokeWidth={1} />
                <h2 className="font-serif text-3xl text-slate">
                    Lancez un diagnostic pour activer la présentation
                </h2>
            </div>
        );
    }

    const { input, compliance, financing, valuation } = result;
    const numberOfUnits = input.numberOfUnits;

    // ── Killer Metric: effort de trésorerie par lot/mois ────────
    // FIX AUDIT FEV 2026 : Renommé "Effort Réel" → "Effort de Trésorerie Mensuel Estimé"
    // pour distinguer flux de trésorerie certain (mensualité) vs estimation théorique (économies).
    const monthlyPerLot = Math.round(financing.monthlyPayment / numberOfUnits);
    const savingsPerLot = Math.round(financing.monthlyEnergySavings / numberOfUnits);
    const effortTresorerie = monthlyPerLot - savingsPerLot;

    // Total subsidies — MPR incluse mais avec mention explicite du statut conditionnel
    const totalSubsidies = financing.mprAmount + financing.ceeAmount + financing.localAidAmount + financing.amoAmount;
    const subsidiesHorsMpr = financing.ceeAmount + financing.localAidAmount + financing.amoAmount;
    const hasMpr = financing.mprAmount > 0;
    const resteComptant = Math.max(0, financing.remainingCost - financing.ecoPtzAmount);

    // ── Status badge color ───────────────────────────────────
    const badgeColor: Record<string, string> = {
        danger: "bg-cost text-white",
        warning: "bg-amber-500 text-white",
        success: "bg-gain text-white",
    };

    return (
        <div className="min-h-screen flex flex-col bg-white relative">

            {/* ── Top Bar: Address & DPE Transition ──────────── */}
            <header className="flex-shrink-0 border-b border-border px-8 py-6 md:px-16 md:py-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-oxford leading-tight">
                            {input.address || "Copropriété"}
                        </h1>
                        <p className="text-lg text-slate mt-2">
                            {numberOfUnits} lots · Gain énergétique {Math.round(financing.energyGainPercent * 100)}%
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* DPE Transition */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-cost-light text-cost text-2xl font-serif font-bold">
                                {input.currentDPE}
                            </span>
                            <svg className="w-6 h-6 text-slate" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gain-light text-gain text-2xl font-serif font-bold">
                                {input.targetDPE}
                            </span>
                        </div>
                        <span className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md ${badgeColor[compliance.statusColor]}`}>
                            {compliance.statusLabel}
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Hero: The Killer Metric ─────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 md:py-0">
                <p className="text-sm md:text-base uppercase tracking-[0.15em] text-slate font-semibold mb-4">
                    Effort de Trésorerie Mensuel Estimé
                </p>
                <div className="flex items-baseline gap-3">
                    <span className="text-7xl md:text-[8rem] lg:text-[10rem] font-serif font-bold text-oxford leading-none tabular-nums">
                        {effortTresorerie > 0 ? effortTresorerie : `+${Math.abs(effortTresorerie)}`}
                    </span>
                    <span className="text-3xl md:text-4xl font-serif text-slate">
                        €<span className="text-xl text-subtle">/mois</span>
                    </span>
                </div>
                <p className="text-sm text-subtle mt-4 max-w-md text-center">
                    Mensualité Éco-PTZ ({monthlyPerLot} €) − Éco. énergie est. ({savingsPerLot} €)
                    {/* FIX AUDIT FEV 2026 : "autofinancée" supprimé si apport comptant > 0
                        (on ne peut pas qualifier d'autofinancé si un capital initial est requis) */}
                    {effortTresorerie <= 0 && resteComptant === 0 && (
                        <span className="block text-gain font-semibold mt-1">
                            Mensualité couverte par les économies d&apos;énergie (hors apport initial)
                        </span>
                    )}
                    {effortTresorerie <= 0 && resteComptant > 0 && (
                        <span className="block text-gain font-semibold mt-1">
                            Mensualité couverte par les économies d&apos;énergie (hors apport initial de {resteComptant.toLocaleString("fr-FR")} €)
                        </span>
                    )}
                </p>

                {/* ⚠️ AVERTISSEMENT LÉGAL UI */}
                <div className="mt-8 max-w-2xl w-full text-left p-4 rounded-lg bg-amber-50/50 border border-amber-200/60">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-2">
                                Avertissement Légal
                            </h4>
                            <p className="text-[10px] text-amber-800/90 leading-relaxed text-justify">
                                L&apos;« Effort de Trésorerie Mensuel » est une estimation nette intégrant des économies d&apos;énergie théoriques. Il ne reflète pas le montant réel de vos appels de fonds travaux ou de vos mensualités d&apos;emprunt, qui doivent être réglés intégralement à leurs échéances respectives. La responsabilité du syndic ne saurait être engagée en cas de variation des tarifs de l&apos;énergie ou des barèmes de subventions étatiques.
                            </p>
                            <button
                                onClick={() => setIsLegalModalOpen(true)}
                                className="mt-2 text-[10px] font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
                            >
                                Lire les mentions légales complètes &amp; RGPD
                            </button>
                        </div>
                    </div>
                </div>

                <LegalNoticeModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
            </div>

            {/* ── Bottom: Macro Figures ───────────────────────── */}
            <div className="flex-shrink-0 border-t border-border bg-alabaster">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                    <MacroCard
                        label="Reste au comptant"
                        value={formatCurrency(resteComptant)}
                        sublabel="à régler immédiatement"
                    />
                    {/* FIX AUDIT FEV 2026 : sublabel insiste sur le caractère latent/illiquide
                        pour distinguer ce gain patrimonial du cash-flow réel. */}
                    <MacroCard
                        label="Gain Valeur Verte"
                        value={`+ ${formatCurrency(valuation.greenValueGain)}`}
                        sublabel="gain patrimonial latent — illiquide"
                        accent="gain"
                    />
                    <MacroCard
                        label="Subventions obtenues"
                        value={formatCurrency(totalSubsidies)}
                        sublabel={hasMpr ? "MPR (sous réserve LFI 2026) + CEE + Aides" : "CEE + AMO + Aides"}
                        accent="brass"
                    />
                </div>
            </div>

            {/* ── Objection Handler (floating) ────────────────── */}
            <ObjectionHandler />
        </div>
    );
}

// ─── Macro Card Component ────────────────────────────────────────────────────
function MacroCard({
    label,
    value,
    sublabel,
    accent,
}: {
    label: string;
    value: string;
    sublabel: string;
    accent?: "gain" | "brass";
}) {
    const valueColor = accent === "gain" ? "text-gain" : accent === "brass" ? "text-brass-dark" : "text-oxford";

    return (
        <div className="flex flex-col items-center justify-center px-8 py-8 md:py-10 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate mb-3">
                {label}
            </span>
            <span className={`text-3xl md:text-4xl font-serif font-bold tabular-nums ${valueColor}`}>
                {value}
            </span>
            <span className="text-[10px] text-subtle mt-2">{sublabel}</span>
        </div>
    );
}
