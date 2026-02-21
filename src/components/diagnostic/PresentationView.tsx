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
    const [showWarning, setShowWarning] = useState(true);

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
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${compliance.statusColor === 'danger' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
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
                {showWarning && (
                    <div className="mt-12 max-w-2xl w-full text-left animate-fadeInUp" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
                        <div className="flex bg-navy-light/10 border border-navy/20 rounded-lg p-4 sm:p-5 shadow-sm relative pr-10">
                            <button
                                onClick={() => setShowWarning(false)}
                                className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
                                aria-label="Fermer l'avertissement"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <AlertTriangle className="w-5 h-5 text-navy flex-shrink-0 mt-0.5" />
                            <div className="ml-3 sm:ml-4">
                                <h3 className="text-sm font-bold text-oxford tracking-tight">Avertissement Légal</h3>
                                <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed font-medium">
                                    L&apos;« Effort de Trésorerie Mensuel » est une estimation nette intégrant des économies d&apos;énergie théoriques. Il ne reflète pas le montant réel de vos appels de fonds travaux ou de vos mensualités d&apos;emprunt, qui doivent être réglés intégralement à leurs échéances respectives. La responsabilité du syndic ne saurait être engagée en cas de variation des tarifs de l&apos;énergie ou des barèmes de subventions étatiques.
                                </p>
                                <button
                                    onClick={() => setIsLegalModalOpen(true)}
                                    className="mt-3 text-[11px] font-bold tracking-wide uppercase text-navy hover:text-navy-light transition-colors flex items-center gap-1 group"
                                >
                                    Lire les mentions légales complètes &amp; RGPD
                                    <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <LegalNoticeModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
            </div>


            {/* ── Bottom: Macro Figures ───────────────────────── */}
            <div className="flex-shrink-0 bg-alabaster/50 border-t border-border mt-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 md:p-12 max-w-7xl mx-auto">
                    <MacroCard
                        label="Reste au comptant"
                        value={formatCurrency(resteComptant)}
                        sublabel="à régler immédiatement"
                        accent="slate"
                    />
                    {/* FIX AUDIT FEV 2026 : sublabel insiste sur le caractère latent/illiquide
                        pour distinguer ce gain patrimonial du cash-flow réel. */}
                    <MacroCard
                        label="Gain Valeur Verte"
                        value={`+ ${formatCurrency(valuation.greenValueGain)}`}
                        sublabel="gain patrimonial latent — illiquide"
                        accent="navy"
                    />
                    <MacroCard
                        label="Subventions obtenues"
                        value={formatCurrency(totalSubsidies)}
                        sublabel={hasMpr ? "MPR (sous réserve LFI 2026) + CEE + Aides" : "CEE + AMO + Aides"}
                        accent="navy"
                    />
                </div>
            </div>

            {/* ── Objection Handler (floating) ────────────────── */}
            <ObjectionHandler />
        </div>
    );
}

function MacroCard({
    label,
    value,
    sublabel,
    accent,
}: {
    label: string;
    value: string;
    sublabel: string;
    accent?: "navy" | "slate";
}) {
    const textColors = {
        navy: "text-navy",
        slate: "text-oxford"
    };

    return (
        <div className="flex flex-col items-center justify-center bg-white px-8 py-8 md:py-10 text-center rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate mb-3">
                {label}
            </span>
            <span className={`text-3xl md:text-4xl font-serif font-bold tabular-nums ${textColors[accent || 'slate']}`}>
                {value}
            </span>
            <span className="text-[11px] font-medium text-subtle mt-2.5 max-w-[200px] leading-tight">{sublabel}</span>
        </div>
    );
}
