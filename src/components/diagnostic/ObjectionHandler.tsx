"use client";

/**
 * VALO-SYNDIC — ObjectionHandler
 * ==============================
 * Discreet "cheat sheet" for property managers during General Assembly.
 * Floating button → side panel with 4 data-driven objection responses.
 */

import { useState } from "react";
import { useDiagnosticStore } from "@/stores/useDiagnosticStore";
import { formatCurrency } from "@/lib/calculator";
import { ShieldAlert, X, ChevronRight } from "lucide-react";

// ─── Objection Data Builder ──────────────────────────────────────────────────

interface Objection {
    id: string;
    trigger: string;
    icon: string;
    getAnswer: (r: NonNullable<ReturnType<typeof useDiagnosticStore.getState>["result"]>) => string;
}

const OBJECTIONS: Objection[] = [
    {
        id: "trop-cher",
        trigger: "\"C'est trop cher !\"",
        icon: "💰",
        getAnswer: (r) => {
            const monthly = r.financing.monthlyPayment / r.input.numberOfUnits;
            const savings = r.financing.monthlyEnergySavings / r.input.numberOfUnits;
            const effort = Math.round(monthly - savings);
            const totalAides = r.financing.mprAmount + r.financing.ceeAmount + r.financing.localAidAmount + r.financing.amoAmount;

            const effortText = effort > 0
                ? `L'effort réel n'est que de ${effort} €/mois par lot après déduction des économies d'énergie.`
                : `Il n'y a aucun effort de trésorerie : vous gagnez même ${Math.abs(effort)} €/mois par lot grâce aux économies d'énergie.`;

            return `${effortText} Le prêt Éco-PTZ à 0% de ${formatCurrency(r.financing.ecoPtzAmount)} absorbe le choc initial. Les subventions collectives couvrent ${formatCurrency(totalAides)} du projet.`;
        },
    },
    {
        id: "vente",
        trigger: "\"Je vends bientôt, ça ne me concerne pas.\"",
        icon: "🏠",
        getAnswer: (r) => {
            const gainPerLot = formatCurrency(r.valuation.greenValueGain / r.input.numberOfUnits);
            return `La location des passoires thermiques (F/G) est/sera bientôt interdite, ce qui entraîne une forte décote à la revente. En rénovant vers un DPE ${r.input.targetDPE}, votre lot gagne en moyenne ${gainPerLot} en Valeur Verte (soit +${Math.round(r.valuation.greenValueGainPercent * 100)}%). L'investissement est donc rentable à la revente.`;
        },
    },
    {
        id: "aides",
        trigger: "\"On n'aura jamais les aides.\"",
        icon: "🏛️",
        getAnswer: (r) => {
            const ptz = formatCurrency(r.financing.ecoPtzAmount);
            const subventions = formatCurrency(r.financing.mprAmount + r.financing.ceeAmount);
            return `L'Éco-PTZ de ${ptz} est garanti par l'État à 0% sans condition de santé. Les subventions collectives majeures (MPR et CEE, soit ${subventions}) sont acquises pour le syndicat et attribuées sans condition de revenus individuels.`;
        },
    },
    {
        id: "attendre",
        trigger: "\"On attendra l'obligation.\"",
        icon: "⏳",
        getAnswer: (r) => {
            const surchargeTotal = r.inactionCost.projectedCost3Years - r.inactionCost.currentCost;
            const surchargePerLot = formatCurrency(surchargeTotal / r.input.numberOfUnits);
            return `La location des DPE G est interdite depuis 2025 (F dès 2028). D'ici 3 ans, le coût des travaux aura augmenté d'au moins ${formatCurrency(surchargeTotal)} (${surchargePerLot} par lot) avec l'inflation BTP. Agir maintenant, c'est fixer le prix et garantir les aides actuelles.`;
        },
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ObjectionHandler() {
    const { result } = useDiagnosticStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    if (!result) return null;

    return (
        <>
            {/* ── Floating Trigger ────────────────────────── */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-navy text-white rounded-full shadow-lg
                           hover:bg-navy-light active:bg-navy-dark transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                aria-label="Ouvrir le module Objections"
            >
                <ShieldAlert className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-semibold tracking-wide hidden sm:inline">Objections</span>
            </button>

            {/* ── Backdrop ────────────────────────────────── */}
            <div
                className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ease-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setIsOpen(false)}
                aria-hidden
            />

            {/* ── Side Panel ─────────────────────────────── */}
            <aside
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-navy shadow-2xl
                            transition-transform duration-300 ease-out
                            ${isOpen ? "translate-x-0" : "translate-x-full"}`}
                role="dialog"
                aria-label="Module Objections AG"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-white" strokeWidth={1.5} />
                        <h2 className="text-lg font-serif font-semibold text-white">
                            Avocat du Diable
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Objection List */}
                <div className="px-6 py-4 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
                    {OBJECTIONS.map((obj) => {
                        const isActive = activeId === obj.id;
                        return (
                            <div key={obj.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveId(isActive ? null : obj.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left
                                               transition-colors duration-150
                                               hover:bg-white/5 group"
                                    aria-expanded={isActive}
                                >
                                    <span className="text-xl flex-shrink-0">{obj.icon}</span>
                                    <span className="flex-1 text-sm font-semibold text-white/90">
                                        {obj.trigger}
                                    </span>
                                    <ChevronRight
                                        className={`w-4 h-4 text-white/30 transition-transform duration-200 ${isActive ? "rotate-90" : ""}`}
                                        strokeWidth={1.5}
                                    />
                                </button>

                                {/* Answer */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-out ${isActive ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                >
                                    <div className="ml-11 mr-4 mb-3 px-4 py-3 rounded-lg bg-white/5 border-l-2 border-navy-light">
                                        <p className="text-sm text-white/80 leading-relaxed">
                                            {obj.getAnswer(result)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer Tip */}
                    <div className="pt-4 border-t border-white/10 mt-4">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider text-center">
                            Données issues du diagnostic en cours · {result.input.numberOfUnits} lots
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
